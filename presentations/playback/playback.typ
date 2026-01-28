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

= Project Status

== Tasks Completed <complete>
- User authentication flow
- Add/Edit/Delete Calendar events
#ref(<resources>, form: "page")

== Issues
#columns(2)[
  - Creating calendars is broken
]

== Upcoming tasks
- Link up calendar to the db
- Finish modal functionality

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

== External resources <resources>

- #link("https://drive.google.com/drive/folders/1HvQlo1yDP400Pg3PkIC4aS7N-LgmNZ3R")[Videos] #ref(<complete>, form: "page")
