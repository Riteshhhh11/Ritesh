
  document.querySelectorAll('a.card[data-disabled="true"]').forEach(a => {
    a.addEventListener('click', (e) => e.preventDefault());
    a.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
    });
  });