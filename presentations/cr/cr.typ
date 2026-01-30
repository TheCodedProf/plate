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

= Overview

== Data Flow
#align(center, block[
  #diagram(
    node-stroke: 1pt,
    node-corner-radius: 2pt,
    node((0,0), [Next.JS Web/PWA], fill: yellow.lighten(50%)),
    edge((0,0), (0,1), "<|-|>"),
    node((0,1), [Next.JS Backend], fill: red.lighten(50%)),
    edge((0,1), (1,1), "-|>"),
    node((1,1), [State Cache], shape: cylinder, fill: blue.lighten(50%)),
    edge((1,1), (1,2), "-|>"),
    node((1,2), [Cache Hit], shape: diamond, fill: green.lighten(50%)),
    edge((1,2), (0,1), label: "hit", "-|>", label-side: center),
    edge((1,2), (0,2), label: "miss", "-|>", label-side: center),
    node((0,2), [Drizzle ORM], shape: pill, fill: red.lighten(50%)),
    edge((0,2),(0,1), "-|>"),
    edge((0,2), (0,3), "<|-|>"),
    node((0,3), [Postgresql], shape: cylinder, fill: blue.lighten(50%)),
  )
])

= Project Status

= Thanks for your time
