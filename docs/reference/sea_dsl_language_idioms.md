SEA_DSL_PART_B_IDIOMS:
goal: >
Expert modeling patterns (how SEA-DSL is typically written when it scales).
These are “agent moves”: repeatable templates + when to use them + common pitfalls.

conventions:
naming:
concepts: '"Title Case Strings"' # Entity/Resource/Flow/Relation/Role/Metric names are usually quoted
ids: snake_case_identifiers # policy names, instance ids, migration policy ids
domains: bare_identifiers_or_dotted # e.g., auth, finance, procurement, com.example.payments
ordering_preference: # grammar allows any order; this is the idiomatic order - file_annotations - imports - dimensions - units - entities - resources - flows - relations - patterns - policies - metrics - instances - evolution: [@replaces/@changes, ConceptChange] - projections_and_mappings

patterns:

    - id: P01_namespaces_as_contract
      intent: >
        Use @namespace and domain qualifiers consistently so a model can be merged safely.
      do:
        - 'Use @namespace at file top for each logical domain emitted by this file.'
        - 'Prefer "in <domain>" on Entity/Role and "in <domain>" or "<unit> in <domain>" on Resource.'
      avoid:
        - 'Mixing implicit and explicit domains in the same module without a reason.'
      good:
        sea: |
          @namespace "com.example.payments"
          @namespace "com.example.finance"

          Entity "PaymentProcessor" in com.example.payments
          Resource "Money" USD in com.example.finance
      bad:
        sea: |
          @namespace "com.example.payments"
          Entity "PaymentProcessor"        # no domain; becomes ambiguous when composed
          Resource "Money" USD             # no domain; collides easily
      observable_success: "Cross-file merges do not produce name/domain collisions."

    - id: P02_stdlib_is_the_base_layer
      intent: "Treat std:* modules as foundational vocabulary; alias imports to avoid clashes."
      do:
        - 'Import std modules with wildcard alias: import * as Std from "std:core"'
        - 'Prefer named import only when you want to pin a small surface: import { User } from "std:core"'
      good:
        sea: |
          import * as Std from "std:core"
          import { HTTP_Request as Req } from "std:http"
      avoid:
        - "Re-declaring obvious primitives already in std unless you are intentionally overriding in your domain."

    - id: P03_resource_scope_is_explicit
      intent: >
        Resources frequently collide by name; scope them explicitly using unit + domain when relevant.
      do:
        - 'Use: Resource "Money" USD in finance'
        - 'Use: Resource "Token" units in auth'
      note:
        from_examples: "Resource scope forms used in repo examples."
      good:
        sea: |
          Resource "Money" USD in finance
          Resource "Token" units in auth
      bad:
        sea: |
          Resource "Money"       # loses currency/unit semantics
      symptom_if_wrong: "Policies/metrics referring to resource/unit become underspecified."

    - id: P04_flow_name_matches_resource_name
      intent: >
        Common idiom: a Flow is named after the Resource moved.
        This is seen directly in examples (Flow "Token" for Resource "Token"; Flow "Money" for Resource "Money").
      do:
        - 'Resource "X" ... then Flow "X" from "A" to "B" quantity N'
      good:
        sea: |
          Resource "Token" units in auth
          Flow "Token" from "User" to "User" quantity 1
      bad:
        sea: |
          Resource "Token" units in auth
          Flow "IssueToken" from "User" to "User" quantity 1  # valid, but breaks common convention
      when_to_break: "When you need multiple distinct flows that move the same resource."

    - id: P05_relations_explain_meaning_via_svo
      intent: >
        Use Relation for semantic triples (Subject/Predicate/Object),
        optionally anchored to a Flow via 'via: flow "..."'.
      do:
        - 'Use human-readable predicate strings.'
        - "Use via: flow when a relation is materially realized by a flow."
      good:
        sea: |
          relation "PaidBy"
            subject: "Invoice"
            predicate: "is paid by"
            object: "Payment"
            via: flow "Money"
      avoid:
        - "Encoding semantic meaning only in flow names when you need explicit semantics."

    - id: P06_policies_are_named_constraints_not_comments
      intent: >
        Policies should be machine-checkable expressions.
        If you need explanation, put it in @rationale / @tags (not in the expression).
      do:
        - 'policy <id> ... as: <boolean-expression>'
        - 'Use per Kind Modality priority when you need governance/ordering.'
      good:
        sea: |
          policy no_negative_amount
            per Constraint Prohibition priority 10
            @rationale "Avoid invalid invoices"
            @tags ["billing", "validation"]
          as: (amount >= 0)
      bad:
        sea: |
          policy validate_amount as:
            "Amounts should not be negative"  # not a boolean expression; will fail validation/intent
      symptom_if_wrong: "Projection/validation can’t enforce intent; policy becomes inert."

    - id: P07_policy_scope_via_quantifiers
      intent: >
        Policies over sets should use forall/exists over collections (flows/entities/resources/instances/relations).
      do:
        - 'forall f in flows: (...)'
        - 'exists e in entities: (...)'
      good:
        sea: |
          policy all_money_flows_positive as:
            forall f in flows: (f.resource = "Money" and f.quantity > 0)
      pitfall:
        - "Using free variables (e.g., f.quantity) without binding f via forall/exists."
      symptom_if_wrong: "Parser may accept; semantic validation fails due to unbound identifiers."

    - id: P08_metrics_use_comprehensions_and_annotations
      intent: >
        Metrics are aggregations over collections, plus operational annotations
        (window/refresh/threshold/target/severity/unit).
        This matches repo metric examples.
      good:
        sea: |
          Metric "payment_count" as:
            count(f in flows where f.resource = "Money": f.quantity)
            @threshold 100
            @severity "warning"
            @refresh_interval 300 "seconds"
      strong_defaults:
        - "@window when you want time-scoped metrics (e.g., 30 \"days\")"
        - "@unit when you cast/measure quantities (e.g., \"USD\")"
      pitfall:
        - "Putting annotations before the expression block (keep them after the expression)."

    - id: P09_instances_are_for_concrete_scenarios
      intent: >
        Instances define concrete objects of an Entity for examples, tests, or projection seed data.
        Use @id references to connect expressions to a specific instance.
      do:
        - 'instance inv123 of "Invoice" { amount: 100 "USD" }'
        - 'reference it as @inv123'
      good:
        sea: |
          instance inv123 of "Invoice" {
            amount: 100 "USD",
            paid: false
          }

          policy inv_has_amount as: (@inv123.amount > 0)
      pitfall:
        - "Using quoted instance ids (instance ids are identifiers, not strings)."

    - id: P10_evolution_is_explicit_and_traceable
      intent: >
        Versioning is done by: new named concept + vX + @replaces/@changes,
        and migration metadata via ConceptChange.
        This matches the evolution examples in the repo.
      do:
        - 'Entity "VendorV2" v2.0.0 @replaces "Vendor" v1.0.0 @changes [...] in procurement'
        - 'ConceptChange "Vendor_v2_1_migration" @from_version v2.0.0 @to_version v2.1.0 ...'
      good:
        sea: |
          Entity "Vendor" v1.0.0 in procurement

          Entity "VendorV2" v2.0.0
            @replaces "Vendor" v1.0.0
            @changes ["added credit_limit", "added payment_terms"]
            in procurement

          ConceptChange "Vendor_v2_migration"
            @from_version v1.0.0
            @to_version v2.0.0
            @migration_policy mandatory
            @breaking_change true
      avoid:
        - "Mutating a concept in-place without @replaces/@changes (you lose traceability)."

    - id: P11_model_minimum_then_refine
      intent: >
        SEA-DSL rewards starting with smallest valid declarations and then layering semantics.
        Example-driven: basic.sea and namespace examples are minimal.
      do:
        - "Start with Entity/Resource/Flow skeleton."
        - "Then add Policy/Metric."
        - "Then add Evolution / Mappings / Projections."
      good_progression:
        step1: |
          Entity "User" in auth
          Resource "Token" units in auth
          Flow "Token" from "User" to "User" quantity 1
        step2: |
          policy token_quantity_is_one as: forall f in flows: (f.resource="Token" and f.quantity=1)

    - id: P12_mapping_vs_projection
      intent: >
        Use Mapping when you want a typed target structure with explicit primitive routing (-> TargetType { ... }).
        Use Projection when you want property-level mapping (props: {"a"->"b"}).
      rule_of_thumb:
        mapping: "structure-first, target schemas (CALM/KG/SBVR/Proto) as explicit types"
        projection: "field/prop transform and renaming"
      good:
        sea: |
          Mapping "SEA->CALM" for calm {
            Entity "Customer" -> CalmEntity { kind: "Actor", active: true }
          }

          Projection "SEA->KG" for kg {
            Entity "Customer" { nodeLabel: "Customer", props: {"id"->"customer_id"} }
          }
      pitfall:
        - "Trying to do renames inside Mapping without a target structure that supports it."

anti_patterns: - id: A01_free_identifiers_in_expressions
symptom: "Validation complains about unknown/unbound identifiers."
fix: "Bind variables with forall/exists or use @instance references."

    - id: A02_domainless_concepts_in_composable_models
      symptom: "Collisions after import/merge; ambiguous references."
      fix: "Add explicit 'in <domain>' / scope resources with unit+domain."

    - id: A03_inert_policies
      symptom: "Policy parses but never constrains anything meaningful."
      fix: "Ensure policy expression is boolean and references real fields/collections."

copy_paste_scaffolds:
module_skeleton: |
@namespace "com.example.<domain>"
@version "1.0.0"

      import * as Std from "std:core"

      Entity "Thing" in com.example.<domain>
      Resource "ThingResource" units in com.example.<domain>
      Flow "ThingResource" from "Thing" to "Thing" quantity 1

      policy example_constraint as:
        forall f in flows: (f.quantity > 0)

    evolution_skeleton: |
      Entity "Concept" v1.0.0 in <domain>

      Entity "ConceptV2" v2.0.0
        @replaces "Concept" v1.0.0
        @changes ["..."]
        in <domain>

      ConceptChange "Concept_v2_migration"
        @from_version v1.0.0
        @to_version v2.0.0
        @migration_policy mandatory
        @breaking_change true
