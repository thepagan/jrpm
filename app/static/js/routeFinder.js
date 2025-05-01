async function planRoute() {
  try {
    const startInput = document.getElementById('start');
    const endInput = document.getElementById('end');
    const routeDisplay = document.getElementById('routeDisplay');

    const startLocation = startInput.value.trim();
    const endLocation = endInput.value.trim();

    if (!startLocation || !endLocation) {
      routeDisplay.textContent = 'Please enter both start and end locations.';
      return;
    }

    routeDisplay.textContent = 'Calculating route...';

    // Simulate route calculation with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demonstration, just display the route as a string
    routeDisplay.textContent = `Route from ${startLocation} to ${endLocation} planned successfully.`;
  } catch (error) {
    const routeDisplay = document.getElementById('routeDisplay');
    routeDisplay.textContent = 'An error occurred while planning the route.';
    console.error(error);
  }
}
