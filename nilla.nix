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

      packages.plateRunScript = {
        systems = [ "aarch64-linux" ];
        package = {
          writeScriptBin
        }: writeScriptBin "start" ''
            /bin/bun i
            /bin/bunx drizzle-kit migrate
            /bin/bun run build
            /bin/bun run start
          '';
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
              mkdir -p $out/plate
              cp -r . $out/plate
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
            nodejs_24
          }:
          dockerTools.buildImage {
            config = {
              WorkingDir = "/plate/";
              Cmd = [
                "/bin/start"
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
                nodejs_24
                config.packages.plateSite.result."x86_64-linux"
                config.packages.plateRunScript.result."aarch64-linux"
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
