export async function GET() {
  return Response.json({
    ok: true,
    service: "dg-stats-web",
    timestamp: new Date().toISOString()
  });
}
