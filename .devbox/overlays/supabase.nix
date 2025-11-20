{ lib, pkgs }:

# Overlay: bring supabase from the nixpkgs-unstable channel

let
  newer = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/nixos-unstable.tar.gz";
  }) { inherit (pkgs) system; };
in
{
  supabase = newer.supabase;
}
