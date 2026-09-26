/** Render both existing template syntaxes without interpreting user input as replacement code. */
export function renderPromptTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([\w-]+)\}\}|\[([\w-]+)\]/g, (match, braces, brackets) => {
    const key = braces || brackets
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
  })
}
