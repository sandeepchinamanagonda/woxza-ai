import { readFile } from "node:fs/promises"

const templateUrl = name => new URL(`./templates/${name}.html`, import.meta.url)
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character])

async function render(name, values) {
  const source = await readFile(templateUrl(name), "utf8")
  return source.replace(/{{(\w+)}}/g, (_, key) => escapeHtml(values[key]))
}

export const renderDemoSummary = values => render("demo_summary", values)
export const renderWaitlistConfirmation = values => render("waitlist_confirmation", values)
