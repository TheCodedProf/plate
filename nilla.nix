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

      packages.plateSite = {
        systems = [ "x86_64-linux" ];
        package =
          {
            stdenv,
          }:
          stdenv.mkDerivation {
            name = "plate";
            src = ./src;

            buildPhase = ''
              cp -r . $out
            '';
          };
      };

      packages.container = {
        systems = [ "x86_64-linux" ];
        package =
          {
            dockerTools,
            buildEnv,
            bun,
            bash,
          }:
          dockerTools.buildImage {
            config = {
              WorkingDir = "/plate";
              Cmd = [
                "bun"
                "prod"
              ];
            };

            name = "plate";
            tag = "latest";

            fromImage = dockerTools.buildImage {
              name = "node";
              tag = "25-alpine3.22";
            };

            copyToRoot = buildEnv {
              name = "plate-root";

              paths = [
                bun
                bash
                config.packages.plateSite.result
              ];

              pathsToLink = [
                "/bin"
                "/plate"
              ];
            };
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
              pkgs.cloudflared
            ];
          };
      };
    };
  }
)
