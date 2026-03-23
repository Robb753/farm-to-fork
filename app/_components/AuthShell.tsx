import Image from "next/image";
import { COLORS } from "@/lib/config";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps): JSX.Element {
  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          <aside
            className="rounded-2xl border p-6 md:p-8 flex flex-col justify-between"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <div>
              <Image
                src="/logof2f.svg"
                alt="Farm To Fork"
                width={180}
                height={60}
                priority
                className="h-auto w-auto max-h-14 object-contain mb-6"
              />

              <h1
                className="text-3xl md:text-4xl font-bold mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {title}
              </h1>

              <p
                className="text-sm md:text-base leading-6"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {subtitle}
              </p>
            </div>

            <div
              className="mt-8 rounded-xl p-4 md:p-5"
              style={{ backgroundColor: COLORS.PRIMARY_BG }}
            >
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Bienvenue sur Farm To Fork
              </p>

              <p
                className="text-sm leading-6"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Découvrez des producteurs locaux, enregistrez vos fermes
                favorites et accédez à votre espace personnel simplement.
              </p>
            </div>
          </aside>

          <main
            className="rounded-2xl border p-6 md:p-8"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}