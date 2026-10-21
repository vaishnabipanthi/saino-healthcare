(() => {
  const token = localStorage.getItem('SAINO_PROVIDER_TOKEN');
  if (!token) {
    window.location.replace('login.html');
    return;
  }
})();
