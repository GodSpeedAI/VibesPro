{ lib, pkgs }:

# Overlay: bring supabase from the nixpkgs-unstable channel (or a specific commit)
# This overlay avoids changing the workspace-wide nixpkgs pin while making
# the supabase package available for the local devbox shell.

let
  newer = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/nixpkgs-unstable.tar.gz";
  }) { inherit (pkgs) system; };
in
{
  supabase = newer.supabase;
}
