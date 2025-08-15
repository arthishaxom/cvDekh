import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { ResumeData } from "../models/resume.model";

const execAsync = promisify(exec);

// ✅ FIXED: Use relative path for Typst template import
const TEMPLATE_PATH = "./resume_template.typ";
const TEMPLATE_SOURCE_PATH = path.join(
  __dirname,
  "../config/resume_template.typ"
);
const TEMP_DIR = path.join(__dirname, "../../temp");

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

// Helper function to escape strings for Typst
function escapeTypstString(str: string): string {
  if (!str || str === "null") return '""';
  return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Helper function to format array for Typst
function formatTypstArray(arr: string[]): string {
  if (!arr || arr.length === 0) return "()";
  const escapedItems = arr
    .filter((item) => item && item !== "null" && item.trim() !== "")
    .map((item) => escapeTypstString(item));
  return `(${escapedItems.join(", ")})`;
}

// Helper function to format education for Typst
function formatEducation(education: ResumeData["education"]): string {
  if (!education || education.length === 0) return "()";

  const formattedEducation = education.map((edu) => {
    return `(
      institution: ${escapeTypstString(edu.institution)},
      field: ${escapeTypstString(edu.field)},
      startDate: ${escapeTypstString(edu.startDate)},
      endDate: ${escapeTypstString(edu.endDate)},
      cgpa: ${escapeTypstString(edu.cgpa)}
    )`;
  });

  return `(${formattedEducation.join(", ")},)`;
}

// Helper function to format experience for Typst
function formatExperience(experience: ResumeData["experience"]): string {
  if (!experience || experience.length === 0) return "()";

  const formattedExperience = experience.map((exp) => {
    return `(
      jobTitle: ${escapeTypstString(exp.jobTitle)},
      company: ${escapeTypstString(exp.company)},
      startDate: ${escapeTypstString(exp.startDate)},
      endDate: ${escapeTypstString(exp.endDate)},
      details: ${formatTypstArray(exp.details || [])}
    )`;
  });

  return `(${formattedExperience.join(", ")},)`;
}

// Helper function to format projects for Typst
function formatProjects(projects: ResumeData["projects"]): string {
  if (!projects || projects.length === 0) return "()";

  const formattedProjects = projects.map((project) => {
    return `(
      title: ${escapeTypstString(project.title)},
      techStack: ${formatTypstArray(project.techStack || [])},
      startDate: ${escapeTypstString(project.startDate)},
      endDate: ${escapeTypstString(project.endDate)},
      details: ${formatTypstArray(project.details || [])}
    )`;
  });

  return `(${formattedProjects.join(", ")},)`;
}

// Helper function to format contact info for Typst
function formatContactInfo(contactInfo: ResumeData["contactInfo"]): string {
  return `(
    phone: ${escapeTypstString(contactInfo?.phone || "")},
    gmail: ${escapeTypstString(contactInfo?.gmail || "")},
    linkedin: ${escapeTypstString(contactInfo?.linkedin || "")},
    github: ${escapeTypstString(contactInfo?.github || "")}
  )`;
}

// Helper function to format skills for Typst
function formatSkills(skills: ResumeData["skills"]): string {
  return `(
    languages: ${formatTypstArray(skills?.languages || [])},
    frameworks: ${formatTypstArray(skills?.frameworks || [])},
    others: ${formatTypstArray(skills?.others || [])}
  )`;
}

// Generate Typst data file content
function generateTypstData(resumeData: ResumeData): string {
  const typstContent = `#import "${TEMPLATE_PATH}": resume_template

#let resume_data = (
  name: ${escapeTypstString(resumeData.name)},
  contactInfo: ${formatContactInfo(resumeData.contactInfo)},
  summary: ${escapeTypstString(resumeData.summary)},
  education: ${formatEducation(resumeData.education)},
  experience: ${formatExperience(resumeData.experience)},
  projects: ${formatProjects(resumeData.projects)},
  skills: ${formatSkills(resumeData.skills)}
)

#resume_template(resume_data)`;

  // ✅ ADD THIS DEBUG LOG
  console.log("Generated Typst content:");
  console.log(typstContent);

  return typstContent;
}

// Main function to generate PDF using Typst
export async function generateResumePdfUtil(
  resumeData: ResumeData
): Promise<Buffer> {
  await ensureTempDir();

  const timestamp = Date.now();
  const tempTypstFile = path.join(TEMP_DIR, `resume_${timestamp}.typ`);
  const tempPdfFile = path.join(TEMP_DIR, `resume_${timestamp}.pdf`);
  const tempTemplateFile = path.join(TEMP_DIR, "resume_template.typ");

  try {
    // ✅ FIXED: Copy template to temp directory so relative import works
    await fs.copyFile(TEMPLATE_SOURCE_PATH, tempTemplateFile);

    // Generate Typst content
    const typstContent = generateTypstData(resumeData);

    // Write Typst file
    await fs.writeFile(tempTypstFile, typstContent, "utf8");

    // Compile with Typst CLI
    const typstCommand = `typst compile "${tempTypstFile}" "${tempPdfFile}"`;

    console.log(`Executing: ${typstCommand}`);

    const { stdout, stderr } = await execAsync(typstCommand, {
      timeout: 30000, // 30 second timeout
    });

    if (stderr) {
      console.warn("Typst stderr:", stderr);
    }

    if (stdout) {
      console.log("Typst stdout:", stdout);
    }

    // Check if PDF was created
    try {
      await fs.access(tempPdfFile);
    } catch {
      throw new Error("PDF file was not created by Typst");
    }

    // Read the generated PDF
    const pdfBuffer = await fs.readFile(tempPdfFile);

    // Clean up temporary files
    await cleanup(tempTypstFile, tempPdfFile, tempTemplateFile);

    return pdfBuffer;
  } catch (error) {
    // Clean up on error
    await cleanup(tempTypstFile, tempPdfFile, tempTemplateFile);

    if (error instanceof Error) {
      console.error("Error generating PDF with Typst:", error.message);
      throw new Error(`PDF generation failed: ${error.message}`);
    }

    throw new Error("Unknown error occurred during PDF generation");
  }
}

// ✅ FIXED: Updated cleanup function to include template file
async function cleanup(
  typstFile: string,
  pdfFile: string,
  templateFile?: string
) {
  try {
    await fs.unlink(typstFile).catch(() => {});
    await fs.unlink(pdfFile).catch(() => {});
    if (templateFile) {
      await fs.unlink(templateFile).catch(() => {});
    }
  } catch (error) {
    console.warn("Error cleaning up temporary files:", error);
  }
}

// Alternative function that returns a readable stream (for direct response streaming)
export async function generateResumePdfStream(
  resumeData: ResumeData
): Promise<NodeJS.ReadableStream> {
  const pdfBuffer = await generateResumePdfUtil(resumeData);

  const { Readable } = await import("node:stream");

  return Readable.from(pdfBuffer);
}

// Function to validate Typst installation
export async function validateTypstInstallation(): Promise<boolean> {
  try {
    const { stdout } = await execAsync("typst --version");
    console.log("Typst version:", stdout.trim());
    return true;
  } catch (error) {
    console.error("Typst is not installed or not in PATH:", error);
    return false;
  }
}
