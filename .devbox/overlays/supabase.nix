{ lib, pkgs }:

# Overlay: bring supabase from the nixpkgs-unstable channel (or a specific commit)
# This overlay avoids changing the workspace-wide nixpkgs pin while making
# the supabase package available for the local devbox shell.

let
  # NOTE: For reproducible builds, prefer pinning a specific commit or tag here
  # (e.g. 'nixos-23.11' or a commit SHA). The current default is the 'nixos-23.11'
  # release tarball which should be stable and reproducible across contributors and CI.
  newer = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/205fd4226592cc83fd4c0885a3e4c9c400efabb5.tar.gz";
  }) { inherit (pkgs) system; };
in
{
  supabase = newer.supabase;
}
