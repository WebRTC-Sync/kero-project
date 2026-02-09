export default function LayoutCheckPage() {
  if (process.env.NEXT_PUBLIC_E2E !== "1") {
    return <div>Not available</div>;
  }

  const modes = ["normal", "quiz", "perfect"];

  return (
    <div className="flex flex-col gap-10 p-4">
      {modes.map((mode) => (
        <section key={mode} data-testid={`${mode}-section`} className="border p-4">
          <h2 className="mb-4 text-xl font-bold uppercase">{mode}</h2>
          <div className="flex flex-col lg:flex-row h-[500px] w-full border relative">
             <div data-testid={`${mode}-main`} className="flex-1 bg-blue-100 p-4">
               Main Content ({mode})
             </div>
             <aside data-testid={`${mode}-camera`} className="w-full lg:w-80 h-40 lg:h-full bg-red-100 p-4 shrink-0">
               Camera ({mode})
             </aside>
          </div>
        </section>
      ))}
    </div>
  );
}
