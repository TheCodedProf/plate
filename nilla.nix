# SPDX-FileCopyrightText: 2025 FreshlyBakedCake
#
# SPDX-License-Identifier: MIT

let
  pins = import ./npins;

  nilla = import pins.nilla;
in
nilla.create (
  { config, lib }:
  {
    config = {
      inputs = {
        nixpkgs = {
          src = pins.nixpkgs;
        };
      };
      shells.default = {
        systems = [ "x86_64-linux" ];

        shell =
          {
            pkgs,
            mkShell,
          }:
          mkShell {
            packages = [
              pkgs.bun
              pkgs.nodejs_24
              pkgs.eslint_d
              pkgs.eslint
              pkgs.typescript
              pkgs.typescript-language-server
              pkgs.package-version-server
              pkgs.nixd
              pkgs.nil
              pkgs.devenv
              pkgs.typst
              pkgs.tinymist
            ];
          };
      };
    };
  }
)
