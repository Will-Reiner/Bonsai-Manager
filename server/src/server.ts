import app from './app';

// Entrada para desenvolvimento local / Docker. Em produção (Vercel) o app é exportado por api/index.ts.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
