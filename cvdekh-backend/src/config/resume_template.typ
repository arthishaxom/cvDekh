#let resume_template(data) = {
  // Set document properties
  set page(
    paper: "a4",
    margin: (x: 40pt, y: 40pt),
  )

  // Set text properties
  set text(
    font: "Times New Roman",
    size: 10.5pt,
  )

  // Set paragraph properties
  set par(
    justify: true,
    leading: 0.52em,
  )

  // Helper function to create horizontal rules
  let hr() = {
    box(height: 0.5pt)[
      #line(length: 100%, stroke: 0.5pt + black)
    ]
  }

  // Helper function to filter null values
  let filter_null(arr) = {
    arr.filter(item => item != "null" and item != "" and item != none)
  }

  // Name (Header)
  align(center)[
    #text(size: 20pt, weight: "bold")[#data.name]
  ]

  v(15pt, weak: true)

  // Contact Information
  align(center)[
    #let contacts = ()

    #if data.contactInfo.phone != "null" and data.contactInfo.phone != "" {
      contacts.push(data.contactInfo.phone)
    }

    #if data.contactInfo.gmail != "null" and data.contactInfo.gmail != "" {
      contacts.push(link("mailto:" + data.contactInfo.gmail)[#data.contactInfo.gmail])
    }

    #if data.contactInfo.linkedin != "null" and data.contactInfo.linkedin != "" {
      // Handle both with and without https:// prefix
      let linkedin_url = if data.contactInfo.linkedin.starts-with("http") {
        data.contactInfo.linkedin
      } else {
        "https://" + data.contactInfo.linkedin
      }
      contacts.push(link(linkedin_url)[#data.contactInfo.linkedin.replace("https://", "")])
    }

    #if data.contactInfo.github != "null" and data.contactInfo.github != "" {
      // Handle both with and without https:// prefix
      let github_url = if data.contactInfo.github.starts-with("http") {
        data.contactInfo.github
      } else {
        "https://" + data.contactInfo.github
      }
      contacts.push(link(github_url)[#data.contactInfo.github.replace("https://", "")])
    }

    // Format contacts into 1 or 2 lines based on count
    #if contacts.len() <= 3 {
      // Single line for 3 or fewer items
      contacts.join(" | ")
    } else {
      // Two lines for more than 3 items
      let mid_point = calc.ceil(contacts.len() / 2)
      let first_line = contacts.slice(0, mid_point)
      let second_line = contacts.slice(mid_point)

      first_line.join(" | ") + "\n" + second_line.join(" | ")
    }
  ]

  v(6pt)

  // Summary Section
  text(size: 10.5pt, weight: "bold")[SUMMARY]
  hr()
  data.summary

  v(2pt)

  // Education Section
  text(size: 10.5pt, weight: "bold")[EDUCATION]
  hr()
  v(6pt, weak: true)
  for edu in data.education {
    v(1pt)
    grid(
      columns: (70%, 30%),
      [
        #text(weight: "bold")[#edu.institution]
        #v(8pt, weak: true)
        #text(style: "italic")[#edu.field]
      ],
      align(right)[
        #if edu.startDate != "null" and edu.endDate != "null" [
          #edu.startDate - #edu.endDate \
        ]
        #v(8pt, weak: true)
        #if edu.cgpa != "null" and edu.cgpa != "" [
          CGPA: #edu.cgpa
        ]
      ],
    )
  }

  v(2pt)

  // Experience Section (only if there are experiences)
  [#if data.experience.len() > 0 {
    text(size: 10.5pt, weight: "bold")[EXPERIENCE]
    hr()
    v(6pt, weak: true)
    for exp in data.experience {
      v(1pt)
      grid(
        columns: (70%, 30%),
        gutter: 10pt,
        [
          #text(weight: "bold")[#exp.jobTitle] \
          #text(style: "italic")[#exp.company]
        ],
        align(right)[
          #if exp.startDate != "null" and exp.endDate != "null" and exp.startDate != "" and exp.endDate != "" [
            #exp.startDate - #exp.endDate
          ]
        ],
      )
      // Experience details as bullet points
      list(
        ..exp.details,
        spacing: 8pt,
      )
    }

    v(2pt)
  }]

  // Projects Section
  text(size: 10.5pt, weight: "bold")[PROJECTS]
  hr()
  v(6pt, weak: true)
  for project in data.projects {
    v(1pt)
    grid(
      columns: (70%, 30%),
      gutter: 10pt,
      [
        #text(weight: "bold")[#project.title] |
        #text(style: "italic")[#project.techStack.join(", ")]
      ],
      align(right)[
        #if (
          project.startDate != "null"
            and project.endDate != "null"
            and project.startDate != ""
            and project.endDate != ""
        ) [
          #project.startDate - #project.endDate
        ]
      ],
    )


    // Project details as bullet points
    list(..project.details, spacing: 8pt)
  }

  v(2pt)

  // Certification Section (only if there are certifications)
  [#if data.certifications.len() > 0 {
    text(size: 10.5pt, weight: "bold")[CERTIFICATIONS]
    hr()
    v(6pt, weak: true)
    for cert in data.certifications {
      v(1pt)
      grid(
        columns: (70%, 30%),
        gutter: 10pt,
        [
          #text(weight: "bold")[#cert.title] \
          #text(style: "italic")[#cert.company]
        ],
        align(right)[
          #if cert.startDate != "null" and cert.endDate != "null" and cert.startDate != "" and cert.endDate != "" [
            #cert.startDate - #cert.endDate
          ]
        ],
      )
      // Certifications details as bullet points
      list(
        ..cert.details,
        spacing: 8pt,
      )
    }

    v(2pt)
  }]


  v(2pt)

  // Skills Section
  text(size: 10.5pt, weight: "bold")[SKILLS]
  hr()
  v(8pt, weak: true)
  text(weight: "bold")[Languages: ] + data.skills.languages.join(", ")
  v(0.2pt)
  text(weight: "bold")[Frameworks: ] + data.skills.frameworks.join(", ")
  v(0.2pt)
  text(weight: "bold")[Others: ] + data.skills.others.join(", ")
}
