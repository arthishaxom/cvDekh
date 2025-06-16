import pdfPrinter from "pdfmake";
import type {
  Content,
  ContentCanvas,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import { text } from "stream/consumers";

var fonts = {
  Roboto: {
    normal: "fonts/cmun-Regular.ttf",
    bold: "fonts/cmun-Medium.ttf",
    italics: "fonts/cmun-Italic.ttf",
    bolditalics: "fonts/cmun-MediumItalic.ttf",
  },
};

var pdfMake = new pdfPrinter(fonts);

export const hr = ({
  color = "black",
  lineWidth = 0.5,
}: {
  color?: string;
  lineWidth: number;
}): ContentCanvas => ({
  canvas: [
    {
      type: "line",
      x1: 0,
      y1: 0,
      x2: 595 - 2 * 40,
      y2: 0,
      lineWidth,
      lineColor: color,
    },
  ],
});

export function generateResumePdf(resumeData: any) {
  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 40],
    content: [
      {
        text: resumeData.name,
        style: "header",
        alignment: "center",
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 0],
      },
      {
        stack: (() => {
          const contacts = [
            resumeData.contactInfo.phone !== "null"
              ? resumeData.contactInfo.phone
              : null,
            resumeData.contactInfo.gmail !== "null"
              ? resumeData.contactInfo.gmail
              : null,
            resumeData.contactInfo.linkedin !== "null"
              ? resumeData.contactInfo.linkedin
              : null,
            resumeData.contactInfo.github !== "null"
              ? resumeData.contactInfo.github
              : null,
          ].filter(Boolean);

          return [
            {
              text: contacts.join(" | "),
              alignment: "center",
            },
          ];
        })(),
        margin: [0, 0, 0, 0],
      },
      {
        text: "SUMMARY",
        style: "sectionHeader",
      },
      hr({ color: "black", lineWidth: 0.5 }),
      {
        text: resumeData.summary,
        margin: [0, 5, 0, 0],
      },
      {
        text: "EDUCATION",
        style: "sectionHeader",
      },
      hr({ color: "black", lineWidth: 0.5 }),
      ...resumeData.education.map((edu: any) => {
        return {
          columns: [
            {
              width: "70%",
              stack: [
                { text: edu.institution, bold: true },
                { text: `${edu.field}`, italics: true },
              ],
            },
            {
              width: "30%",
              stack: [
                {
                  text: `${edu.startDate} - ${edu.endDate}`,
                  alignment: "right",
                },
                {
                  text: edu.cgpa !== "null" ? `CGPA: ${edu.cgpa}` : "",
                  alignment: "right",
                },
              ],
            },
          ],
          margin: [0, 5, 0, 0],
        };
      }),
      ...(resumeData.experience.length === 0
        ? []
        : [
            {
              text: "EXPERIENCE",
              style: "sectionHeader",
            },
            hr({ color: "black", lineWidth: 0.5 }),
          ]),
      ...resumeData.experience.map((exp: any) => {
        return {
          stack: [
            {
              columns: [
                {
                  width: "70%",
                  stack: [
                    { text: exp.jobTitle, bold: true, style: "titleStyle" },
                    { text: exp.company, italics: true },
                  ],
                },
                {
                  width: "30%",
                  text:
                    exp.startDate &&
                    exp.endDate &&
                    exp.startDate !== "null" &&
                    exp.endDate !== "null"
                      ? `${exp.startDate} - ${exp.endDate}`
                      : "",
                  alignment: "right",
                },
              ],
              margin: [0, 5, 0, 5],
            },
            {
              ul: exp.details,
              margin: [0, 0, 0, 0],
            },
          ],
        };
      }),
      {
        text: "PROJECTS",
        style: "sectionHeader",
      },
      hr({ color: "black", lineWidth: 0.5 }),
      ...resumeData.projects.map((project: any) => {
        return {
          stack: [
            {
              columns: [
                {
                  width: "70%",
                  text: [
                    { text: project.title, bold: true },
                    {
                      text: " | ",
                    },
                    {
                      text: project.techStack.join(", "),
                      italics: true,
                    },
                  ],
                  style: "titleStyle",
                },
                {
                  width: "30%",
                  text:
                    project.startDate &&
                    project.endDate &&
                    project.startDate !== "null" &&
                    project.endDate !== "null"
                      ? `${project.startDate} - ${project.endDate}`
                      : "",
                  alignment: "right",
                },
              ],
              margin: [0, 5, 0, 0],
            },
            // {
            //   text: `Technologies: ${project.techStack.join(", ")}`,
            //   italics: true,
            //   margin: [0, 0, 0, 5],
            // },
            {
              ul: project.details,
              margin: [0, 0, 0, 0],
            },
          ],
        };
      }),
      {
        text: "SKILLS",
        style: "sectionHeader",
      },
      hr({ color: "black", lineWidth: 0.5 }),
      {
        text: [
          { text: "Languages: ", bold: true },
          { text: resumeData.skills.languages.join(", ") },
        ],
        margin: [0, 4, 0, 5],
      },
      {
        text: [
          { text: "Frameworks: ", bold: true },
          { text: resumeData.skills.frameworks.join(", ") },
        ],
        margin: [0, 0, 0, 5],
      },
      {
        text: [
          { text: "Others: ", bold: true },
          { text: resumeData.skills.others.join(", ") },
        ],
        margin: [0, 0, 0, 5],
      },
    ],
    styles: {
      sectionHeader: {
        fontSize: 10.5,
        bold: true,
        margin: [0, 8, 0, 0],
      },
      titleStyle: {
        fontSize: 10.5,
      },
    },
  };

  return pdfMake.createPdfKitDocument(docDefinition);
}
