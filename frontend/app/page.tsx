export default async function Home() {
  let backend = 'unknown';
  try {
    const res = await fetch('http://localhost:3001');
    backend = `${res.status}`;
  } catch (e) {
    backend = 'down';
  }
  return (
    <main style={{padding: 24, fontFamily: 'sans-serif'}}>
      <h1>SG-SST (mínimo)</h1>
      <p>Backend status: {backend}</p>
    </main>
  );
}
