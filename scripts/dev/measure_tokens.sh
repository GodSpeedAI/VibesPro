#!/usr/bin/env bash
# Enhanced token counter with ML-powered prompt optimization.
# This script provides both basic and advanced token analysis capabilities.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENHANCED_SCRIPT="${SCRIPT_DIR}/measure_tokens_enhanced.py"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    cat << 'EOF'
Enhanced Token Counter with ML-Powered Prompt Optimization

USAGE:
    $0 <prompt-file> [OPTIONS]

OPTIONS:
    --analyze                   Perform detailed prompt analysis (default)
    --optimize                  Optimize the prompt for effectiveness
    --goal <goal>               Optimization goal: clarity|conciseness|effectiveness|token_efficiency
    --model <model>             AI model: gpt-4|gpt-4-turbo|gpt-3.5-turbo|claude-3-opus|claude-3-sonnet
    --format <format>           Output format: human|json
    --legacy                    Use legacy word-based estimation only
    --help                      Show this help message

EXAMPLES:
    # Basic analysis with enhanced features
    $0 my_prompt.txt

    # Optimize for clarity
    $0 my_prompt.txt --optimize --goal clarity

    # Get JSON output for integration
    $0 my_prompt.txt --analyze --format json

    # Use legacy mode for simple word count
    $0 my_prompt.txt --legacy

The enhanced mode provides:
  - Accurate token counting using tiktoken
  - ML-powered effectiveness analysis
  - Prompt optimization suggestions
  - Cost estimation
  - Temporal learning from usage patterns

EOF
}

check_dependencies() {
    # Check if Python enhanced script exists
    if [[ ! -f "${ENHANCED_SCRIPT}" ]]; then
        printf "%b\n" "${RED}Error: Enhanced script not found at ${ENHANCED_SCRIPT}${NC}" >&2
        return 1
    fi

    # Check if Python is available
    if ! command -v python3 >/dev/null 2>&1; then
        printf "%b\n" "${YELLOW}Warning: Python3 not found, falling back to legacy mode${NC}" >&2
        return 1
    fi

    return 0
}

legacy_count() {
    local prompt_file="$1"

    if [[ ! -f "${prompt_file}" ]]; then
        printf "%b\n" "${RED}Error: prompt file '${prompt_file}' does not exist.${NC}" >&2
        exit 1
    fi

    local word_count char_count
    word_count=$(wc -w < "${prompt_file}")
    char_count=$(wc -c < "${prompt_file}")

    printf "%b\n" "${BLUE}[Legacy Mode] Token Analysis for ${prompt_file}:${NC}"
    printf "  📊 Approximate word count: %b\n" "${GREEN}${word_count}${NC}"
    printf "  📊 Character count: %b\n" "${GREEN}${char_count}${NC}"
    printf "  🤖 Estimated tokens (rough): %b\n" "${GREEN}$((word_count * 4 / 3))${NC}"
    printf "\n"
    printf "%b\n" "${YELLOW}💡 For accurate token counting and optimization, install Python dependencies${NC}"
    printf "%b\n" "${YELLOW}   and use enhanced mode (remove --legacy flag)${NC}"
}

enhanced_count() {
        local prompt_file="$1"
        shift
        local args=("$@")

        # Detect presence of --optimize
        local optimize_present=false
        for _a in "${args[@]}"; do
            if [[ "${_a}" == "--optimize" ]]; then
                optimize_present=true
                break
            fi
        done

        if [[ "${optimize_present}" != true ]]; then
            args=("analyze" "${args[@]}")
        else
            # Replace --optimize with optimize and preserve --goal <value> pairs
            local new_args=()
            local i=0
            while [[ ${i} -lt ${#args[@]} ]]; do
                local arg="${args[${i}]}"
                if [[ "${arg}" == "--optimize" ]]; then
                    new_args+=("optimize")
                    ((i++))
                elif [[ "${arg}" == "--goal" ]]; then
                    # add --goal and its value (if provided)
                    new_args+=("--goal")
                    ((i++))
                    if [[ ${i} -lt ${#args[@]} ]]; then
                        new_args+=("${args[${i}]}")
                        ((i++))
                    fi
                else
                    new_args+=("${arg}")
                    ((i++))
                fi
            done
            args=("${new_args[@]}")
        fi

        # Execute the enhanced Python script
        python3 "${ENHANCED_SCRIPT}" "${prompt_file}" "${args[@]}"
    }

    main() {
        local prompt_file=""
        local use_legacy=false
        local remaining_args=()

        # Parse arguments
        while [[ $# -gt 0 ]]; do
            case $1 in
                --help|-h)
                    show_help
                    exit 0
                    ;;
                --legacy)
                    use_legacy=true
                    shift
                    ;;
                -*)
                    remaining_args+=("$1")
                    shift
                    ;;
                *)
                    if [[ -z "${prompt_file}" ]]; then
                        prompt_file="$1"
                    else
                        remaining_args+=("$1")
                    fi
                    shift
                    ;;
            esac
        done

        # Validate prompt file argument
        if [[ -z "${prompt_file}" ]]; then
            printf "%b\n" "${RED}Error: prompt file argument is required.${NC}" >&2
            printf "\n"
            show_help
            exit 1
        fi

        # Check if file exists
        if [[ ! -f "${prompt_file}" ]]; then
            printf "%b\n" "${RED}Error: prompt file '${prompt_file}' does not exist.${NC}" >&2
            exit 1
        fi

        # Determine which mode to use
        if [[ "${use_legacy}" == "true" ]]; then
            legacy_count "${prompt_file}"
        else
            # Call check_dependencies separately so set -e remains effective
            check_dependencies
            code=$?
            if [[ ${code} -eq 0 ]]; then
                printf "%b\n" "${BLUE}🚀 Using enhanced ML-powered analysis...${NC}"
                enhanced_count "${prompt_file}" "${remaining_args[@]}"
            else
                printf "%b\n" "${YELLOW}⚠️  Falling back to legacy mode...${NC}"
                legacy_count "${prompt_file}"
            fi
        fi
    }

    # Only run main if script is executed directly (not sourced)
    if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
        main "$@"
    fi
