export function getSectionScrollTop(section) {
  const header = document.querySelector(".navbar-inner")
  const headerBottom = header?.getBoundingClientRect().bottom || 90
  const panel = section.querySelector(".demo-shell, .container-custom") || section
  const panelRect = panel.getBoundingClientRect()
  const availableHeight = window.innerHeight - headerBottom - 24
  const breathingRoom = panelRect.height <= availableHeight
    ? Math.max(18, (availableHeight - panelRect.height) / 2)
    : 18

  return Math.max(0, window.scrollY + panelRect.top - headerBottom - breathingRoom)
}

export function scrollSectionIntoView(section, behavior = "smooth") {
  window.scrollTo({
    top: getSectionScrollTop(section),
    behavior
  })
}
