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

= Overview

== Meet the Team
/ *Samuel Shuert*: Authentication, Calendar Week View & Database
/ *Matthew Schardt*: Calendar Month View, Todo Widget
/ *Max Mahn*: Calendar Day View, Dashboard Layout

== Architecture
#diagram(
  node-stroke: 1pt,
  node-corner-radius: 2pt,
  node((0,0), [Next.JS Web/PWA\
    #text([Live state with local copy for optimistic rendering], size: 8pt)
  ], fill: yellow.lighten(50%)),
  edge((0,0), (1,0), "<|-|>"),
  node((1,0), [Next.JS Backend\
    #text([auth, cal, event & todo *api routes*\
      settings *server actions*
    ], size: 8pt)
  ], fill: red.lighten(50%)),
  edge((2,0),(1,0), "<|-|>"),
  node((2,0), [Drizzle ORM\
    #text([JS query to SQL\
      SQL objects to JS objects
    ], size: 8pt)
  ], shape: pill, fill: red.lighten(50%)),
  edge((2,0), (2,1), "<|-|>"),
  node((2,1), [Postgresql\
    #text([
      Tables:
      - Event
      - Todo
      - Feed
      - Settings
      - User
      - Account
      - Session
      Enums:
      - Time Formats
      - Todo Completion Behavior
      - Calendar Display Modes
    ], size: 6pt)
  ], shape: cylinder, fill: blue.lighten(50%)),
)

= Project Status

== Features
- User Authentication
- Auto-adjusting dashboard layout for different screen sizes
- Calendar with Multiple Views
- Todo widget for managing tasks

== Issues
#columns(2)[
  - Mobile View
  - Poor Test Coverage
  #colbreak()
  #figure(
    image("mobile.png", height: 200pt),
    caption: "Mobile View"
  )
]

= Learnings

== Cognitive Complexity <CC>
#columns(2, block[
Cognitive Complexity measures the complexity of a program by analyzing the code's structure and logic.\
\
A rough summary on how it's calculated goes like this: for every
- loop
- conditional statement
- breaking statement
- function call
the complexity increases by one.\
#text([*Nesting* some of these calls can increase the complexity further.], size: 8pt)\
#colbreak()
The use of this when writing an application is important for ensuring that any developer is able to quickly understand any part of the codebase.
#set text(size: 9pt)
```ts
const myMethod = () => {
  try {
    if (conditionA) { // +1
      for (const i=0; i < 10; i++) { // +2 (n=1)
        while (conditionB) { ... } // +3 (n=2)
      }
    }
  } catch (error) { // + 1
    if (conditionB) { ... } // +2 (n=1)
  }
} // Cognitive Complexity 9
```
])
#align(right, block[@ccqr])


== Learning Technologies
#grid(
  columns: (1fr, 1fr),
  rows: (1fr, 1fr),
  gutter: 5pt,
  block[
    === #underline(offset: 4pt)[NextJS]
    Next.js is a full stack React Framework with serverside rendering, file system routing, and API endpoints built in.
  ],
  block[
    === #underline(offset: 4pt)[DrizzleORM]
    DrizzleORM is type-safe database connection manager. It allows us to make queries and mutations to the database with correct type hinting and no chance of our data being malformed (knowingly).
  ],
  block[
    #grid(
      columns: (1fr, 1fr),
      rows: (1fr, 1fr),
      gutter: 5pt,
      block[
        #image(
          "nextJS.png",
          height: 30pt,
        )
      ],
      block[
        #image(
          "DrizzleORM.png",
          height: 30pt
        )
      ],
      block[],
      block[
        #image(
          "TailwindCSS.png",
          width: 30pt
        )
      ]
    )
  ],
  block[
    === #underline(offset: 4pt)[TailwindCSS]
    Tailwind CSS is a CSS framework built with development speed, complete customization, better performance, and less CSS to maintain in mind.
  ]
)

= Repo information

== Statistics

== Details
#figure(
  image("qr.png", height: 200pt),
  caption: "https://github.com/TheCodedProf/plate",
  numbering: none
)

= Q&A

= Thanks for your time

== References <ccqr>
#align(center,
  figure(
    image("CC.png", height: 90%),
    caption: [Link to a paper on\n Cognitive Complexity @CC],
    numbering: none
  )
)
