export interface SkillQuery {
  search?: string;
  category?: string;
  limit?: string; // still string, as all query values are strings
}
