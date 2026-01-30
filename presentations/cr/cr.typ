#import "@preview/diatypst:0.9.0": *
#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge
#import fletcher.shapes: cylinder, diamond, pill, circle
#show: slides.with(
  title: "Plate",
  subtitle: "A clean time management tool",
  authors: ("Samuel Shuert", "Matthew Schardt", "Max Mahn"),
  ratio: 16/9,
  toc: false,
  title-color: rgb("#CC0000"),
)

#set heading(numbering: none)

== Repo
#figure(
  image("qr.png", height: 200pt),
  caption: "https://github.com/TheCodedProf/plate"
)

== Nix Deployment
#columns(2, block[
  #set text(7pt)
  ```nix
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
  ```
  #set text(8pt)
  #colbreak()
  ```nix
  virtualisation.oci-containers = {
    backend = "podman";
    containers.plate = {
      autoStart = true;
      ports = [
        "3000:1035"
      ];

      image = "plate-container";
      imageFile = plate.input.path; # Full path not shown
      extraOptions = [
        "--network=host"
        "--mount type=bind,src=/run/postgres,dst=/mnt/postgres"
      ];

      environmentFiles = [
        "/secrets/plate/.env"
      ];
    };
  };
  ```
])

#columns(2, block[
  #set text(8pt)
  ```nix
  services.nginx.enable = true;
  services.nginx.virtualHosts."plate.coded.codes"= {
    addSSL = true;
    enableACME = true;
    acmeRoot = null;

    locations."/" = {
      proxyPass = "localhost:1099";
      recommendedProxySettings = true;
      proxyWebsockets = true;
    };
  };
  ```
  #colbreak()
  ```nix
  services.postgresql = {
    enable = true;
    ensureDatabases = [ "plate" ];
    ensureUsers = [
      {
        name = "plate";
        ensureDBOwnership = true;
      }
    ];
  };
  ```
])

== Component Tree
#align(center, block[
  #diagram(
    node-stroke: 1pt,
    node-corner-radius: 2pt,
    spacing: 16pt,
    node((0,0), [Root layout]),
    edge((0,0), (0,1), "-|>"),
    node((0,1), [Dashboard]),
    edge((0,1), (0,2), "-|>"),
    node((0,2), [Suspense]),
    edge((0,2), (-1,3), "-|>", label: "fallback", label-size: 8pt, label-side: center),
    node((-1,3), [Loading]),
    edge((0,2), (1,3), "-|>", label-size: 8pt, label-side: center),
    node((1,3), [Container]),
    edge((1,3), (0,4), "-|>"),
    node((0,4), [Todo]),
    edge((1,3), (2,4), "-|>"),
    node((2,4), [Calendar]),
    edge((2,4), (1,5), "-|>", label: "selectedView: day", label-size: 8pt),
    node((1,5), [DayView]),
    edge((2,4), (2,5), "-|>", label: "selectedView: week", label-size: 8pt, label-side: center),
    node((2,5), [WeekView]),
    edge((2,4), (3,5), "-|>", label: "selectedView: month", label-size: 8pt),
    node((3,5), [MonthView]),
  )
])

= Q&A

= Thanks for your time
