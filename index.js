
  // Only run this on the homepage
  if (!new URLSearchParams(window.location.search).get("id")) {
    fetch("projects.json")
      .then(response => {
        if (!response.ok) throw new Error("Could not load projects.json");
        return response.json();
      })
      .then(projects => {
        projects.forEach(project => {
          // Find the corresponding HTML element using the data-id
          const stateElement = document.querySelector(`.card-state[data-id="${project.id}"]`);
          
          if (stateElement && project.build) {
            stateElement.textContent = project.build;

            const stateClass = project.build.toLowerCase().replace(/\s+/g, '-');
            stateElement.classList.add(`state-${stateClass}`);
          }
        });
      })
      .catch(error => console.error("Error loading project states:", error));
  }

  document.querySelectorAll('a.card[data-disabled="true"]').forEach(a => {
    a.addEventListener('click', (e) => e.preventDefault());
    a.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
    });
  });