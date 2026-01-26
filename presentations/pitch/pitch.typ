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

== Meet the Team
/ *Samuel Shuert*: Database & Authentication
/ *Matthew Schardt*: React State
/ *Max Mahn*: Frontend React
\
\
All roles subject to change to meet demand

== Architecture
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

== Tasks Completed
- Database models
- Calendar frame
#columns(2)[
  #figure(
    image("month.png"),
    caption: "Completed monthly view"
  )
  #colbreak()
  #figure(
    image("week.png"),
    caption: "Completed weekly view"
  )
]
== Issues
#columns(3)[
  - Calendar styling
  - Mobile view
  #colbreak()
  #figure(
    image("day.png", height: 75%),
    caption: "Day view needs matching styling"
  )
  #colbreak()
  #figure(
    image("broken.png", height: 75%),
    caption: "Small screen sizes have issues displaying content"
  )
]

== Upcoming tasks
- User Account and Authentication
- Add/Edit/Delete Events

= Problem Solving

== Difficulties
- Matt has always worked as a solo developer, he had to learn to rely on others code to work without spending his time poking through their code.

== Learnings
- Next.js
- Remote Collaboration via a shared terminal
- Our Sort Function

= Repo information

== Statistics
#figure(
  image("insights.png")
)

== Details
#figure(
  image("qr.png", height: 200pt),
  caption: "https://github.com/TheCodedProf/plate"
)

= Q&A

= Thanks for your time
