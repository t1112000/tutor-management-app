function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-[#F4D8DE]/75 ${className}`} />;
}

function MobileLoading() {
  return (
    <div className="relative flex min-h-[100dvh] items-start justify-center overflow-hidden px-4 pt-5 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+24px)] md:hidden">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(232,120,138,0.16), transparent 34%), radial-gradient(circle at top right, rgba(59,111,212,0.10), transparent 28%), radial-gradient(circle at 50% 78%, rgba(118,214,193,0.10), transparent 28%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(110deg, transparent 18%, rgba(255,255,255,0.34) 28%, transparent 40%)",
          backgroundSize: "220% 100%",
          animation: "dashboardLoadingShimmer 2.8s linear infinite",
        }}
      />

      <div className="relative w-full max-w-[420px] pt-1">
        <div className="rounded-[26px] border border-[#F4D8DE] bg-white/82 shadow-[0_20px_54px_rgba(232,120,138,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-[#F4D8DE] px-4 py-4">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]">
              <div
                className="absolute h-5 w-5 rounded-full bg-[#E8788A] shadow-[0_6px_14px_rgba(232,120,138,0.28)]"
                style={{ animation: "dashboardPulse 1.8s ease-in-out infinite" }}
              />
              <div
                className="absolute h-2.5 w-2.5 rounded-full bg-[#76AFFF]"
                style={{ animation: "dashboardOrb 1.8s ease-in-out infinite" }}
              />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-32 bg-[#F0B8C3]/75" />
              <Skeleton className="mt-2 h-3 w-40 bg-[#F6E6EA]/90" />
            </div>
          </div>

          <div className="space-y-4 px-4 py-4">
            <div className="rounded-[20px] border border-[#F4D8DE] bg-[#FFF8FA]/86 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-3.5 w-24 bg-[#F0B8C3]/70" />
                  <Skeleton className="mt-2 h-3 w-36 bg-[#F6E6EA]/90" />
                </div>
                <div className="relative h-12 w-28 overflow-hidden rounded-full border border-[#F4D8DE] bg-white/75">
                  <div
                    className="absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-[#E8788A]"
                    style={{ animation: "dashboardChasePink 1.9s ease-in-out infinite" }}
                  />
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#76AFFF]"
                    style={{ animation: "dashboardChaseBlue 1.9s ease-in-out infinite" }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-[#F4D8DE] bg-white/85 p-3">
                  <Skeleton className="h-3 w-10 bg-[#F6E6EA]" />
                  <Skeleton className="mt-2 h-6 w-12 bg-[#F0B8C3]/70" />
                </div>
                <div className="rounded-2xl border border-[#F4D8DE] bg-white/85 p-3">
                  <Skeleton className="h-3 w-14 bg-[#F6E6EA]" />
                  <Skeleton className="mt-2 h-6 w-14 bg-[#F0B8C3]/70" />
                </div>
                <div className="rounded-2xl border border-[#F4D8DE] bg-white/85 p-3">
                  <Skeleton className="h-3 w-12 bg-[#F6E6EA]" />
                  <Skeleton className="mt-2 h-6 w-14 bg-[#F0B8C3]/70" />
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#F4D8DE] bg-white/84 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28 bg-[#F0B8C3]/70" />
                <Skeleton className="h-7 w-20 rounded-full bg-[#F6E6EA]" />
              </div>

              <div className="mt-3 space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]/90 p-3">
                    <Skeleton className="h-11 w-11 rounded-full bg-[#F0B8C3]/70" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-32 bg-[#F6E6EA]" />
                      <Skeleton className="h-2.5 w-24 bg-[#F6E6EA]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#F4D8DE] bg-[#FFF8FA]/84 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24 bg-[#F0B8C3]/70" />
                <Skeleton className="h-6 w-16 rounded-full bg-[#F6E6EA]" />
              </div>

              <div className="mt-3 space-y-2.5">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-white/90 p-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-[#F0B8C3]/70" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-28 bg-[#F6E6EA]" />
                      <Skeleton className="h-2.5 w-20 bg-[#F6E6EA]" />
                    </div>
                    <Skeleton className="h-3 w-8 bg-[#F6E6EA]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-[#A87888]">
          <span className="h-2 w-2 rounded-full bg-[#E8788A] animate-pulse" />
          <span>Đang tải dữ liệu của bạn</span>
        </div>
      </div>

      <style>{`
        @keyframes dashboardPulse {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes dashboardOrb {
          0% {
            left: 8px;
          }
          50% {
            left: calc(100% - 18px);
          }
          100% {
            left: 8px;
          }
        }
      `}</style>
    </div>
  );
}

function DesktopLoading() {
  return (
    <div className="relative hidden min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 md:flex">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(232,120,138,0.14), transparent 34%), radial-gradient(circle at top right, rgba(59,111,212,0.12), transparent 28%), radial-gradient(circle at bottom center, rgba(118,214,193,0.12), transparent 30%)",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(110deg, transparent 18%, rgba(255,255,255,0.36) 28%, transparent 40%), linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0))",
          backgroundSize: "220% 100%, 100% 100%",
          animation: "dashboardLoadingShimmer 2.6s linear infinite",
        }}
      />

      <div className="relative w-full max-w-5xl">
        <div className="overflow-hidden rounded-[28px] border border-[#F4D8DE] bg-white/78 shadow-[0_20px_60px_rgba(232,120,138,0.10)] backdrop-blur-xl">
          <div className="border-b border-[#F4D8DE] px-5 py-5 md:px-8">
            <Skeleton className="h-6 w-36 bg-[#F0B8C3]/75" />
            <Skeleton className="mt-3 h-3 w-56 bg-[#F6E6EA]/90" />
          </div>

          <div className="space-y-6 px-5 py-6 md:px-8 md:py-8">
            <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="rounded-[24px] border border-[#F4D8DE] bg-[#FFF8FA]/85 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Skeleton className="h-4 w-28 bg-[#F0B8C3]/70" />
                    <Skeleton className="mt-2 h-3 w-44 bg-[#F6E6EA]/90" />
                  </div>
                  <div className="relative h-16 w-40 overflow-hidden rounded-full border border-[#F4D8DE] bg-white/70">
                    <div
                      className="absolute top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-[#E8788A] shadow-[0_8px_20px_rgba(232,120,138,0.30)]"
                      style={{ animation: "dashboardChasePink 1.9s ease-in-out infinite" }}
                    />
                    <div
                      className="absolute top-[38%] h-6 w-6 -translate-y-1/2 rounded-full bg-[#76AFFF] shadow-[0_8px_20px_rgba(118,175,255,0.24)]"
                      style={{ animation: "dashboardChaseBlue 1.9s ease-in-out infinite" }}
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.55) 50%, transparent 75%)",
                        backgroundSize: "200% 100%",
                        animation: "dashboardLoadingShimmer 2.2s linear infinite",
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#F4D8DE] bg-white/80 p-4">
                    <Skeleton className="h-3 w-20 bg-[#F6E6EA]" />
                    <Skeleton className="mt-3 h-8 w-16 rounded-2xl bg-[#F0B8C3]/75" />
                    <Skeleton className="mt-3 h-2 w-full bg-[#F6E6EA]" />
                  </div>
                  <div className="rounded-2xl border border-[#F4D8DE] bg-white/80 p-4">
                    <Skeleton className="h-3 w-24 bg-[#F6E6EA]" />
                    <Skeleton className="mt-3 h-8 w-20 rounded-2xl bg-[#F0B8C3]/75" />
                    <Skeleton className="mt-3 h-2 w-full bg-[#F6E6EA]" />
                  </div>
                  <div className="rounded-2xl border border-[#F4D8DE] bg-white/80 p-4">
                    <Skeleton className="h-3 w-24 bg-[#F6E6EA]" />
                    <Skeleton className="mt-3 h-8 w-20 rounded-2xl bg-[#F0B8C3]/75" />
                    <Skeleton className="mt-3 h-2 w-full bg-[#F6E6EA]" />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#F4D8DE] bg-white/80 p-5">
                <Skeleton className="h-4 w-32 bg-[#F0B8C3]/70" />
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]/90 p-3">
                    <Skeleton className="h-11 w-11 rounded-full bg-[#F0B8C3]/70" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-32 bg-[#F6E6EA]" />
                      <Skeleton className="h-2 w-24 bg-[#F6E6EA]" />
                    </div>
                    <Skeleton className="h-3 w-10 bg-[#F6E6EA]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]/90 p-3">
                    <Skeleton className="h-11 w-11 rounded-full bg-[#F0B8C3]/70" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-28 bg-[#F6E6EA]" />
                      <Skeleton className="h-2 w-20 bg-[#F6E6EA]" />
                    </div>
                    <Skeleton className="h-3 w-10 bg-[#F6E6EA]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]/90 p-3">
                    <Skeleton className="h-11 w-11 rounded-full bg-[#F0B8C3]/70" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-36 bg-[#F6E6EA]" />
                      <Skeleton className="h-2 w-28 bg-[#F6E6EA]" />
                    </div>
                    <Skeleton className="h-3 w-10 bg-[#F6E6EA]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[24px] border border-[#F4D8DE] bg-white/80 p-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40 bg-[#F0B8C3]/70" />
                  <Skeleton className="h-8 w-28 rounded-full bg-[#F6E6EA]" />
                </div>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]/90 p-3">
                    <Skeleton className="h-3 w-14 bg-[#F6E6EA]" />
                    <Skeleton className="h-3 flex-1 bg-[#F6E6EA]" />
                    <Skeleton className="h-3 w-16 bg-[#F6E6EA]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]/90 p-3">
                    <Skeleton className="h-3 w-14 bg-[#F6E6EA]" />
                    <Skeleton className="h-3 flex-1 bg-[#F6E6EA]" />
                    <Skeleton className="h-3 w-20 bg-[#F6E6EA]" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#F4D8DE] bg-[#FFF8FA]/90 p-3">
                    <Skeleton className="h-3 w-16 bg-[#F6E6EA]" />
                    <Skeleton className="h-3 flex-1 bg-[#F6E6EA]" />
                    <Skeleton className="h-3 w-14 bg-[#F6E6EA]" />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#F4D8DE] bg-[#FFF8FA]/85 p-5">
                <Skeleton className="h-4 w-36 bg-[#F0B8C3]/70" />
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#F4D8DE] bg-white/85 p-4">
                    <Skeleton className="h-3 w-16 bg-[#F6E6EA]" />
                    <Skeleton className="mt-3 h-10 w-20 rounded-2xl bg-[#F0B8C3]/70" />
                  </div>
                  <div className="rounded-2xl border border-[#F4D8DE] bg-white/85 p-4">
                    <Skeleton className="h-3 w-16 bg-[#F6E6EA]" />
                    <Skeleton className="mt-3 h-10 w-20 rounded-2xl bg-[#F0B8C3]/70" />
                  </div>
                  <div className="rounded-2xl border border-[#F4D8DE] bg-white/85 p-4">
                    <Skeleton className="h-3 w-20 bg-[#F6E6EA]" />
                    <Skeleton className="mt-3 h-10 w-24 rounded-2xl bg-[#F0B8C3]/70" />
                  </div>
                  <div className="rounded-2xl border border-[#F4D8DE] bg-white/85 p-4">
                    <Skeleton className="h-3 w-14 bg-[#F6E6EA]" />
                    <Skeleton className="mt-3 h-10 w-16 rounded-2xl bg-[#F0B8C3]/70" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <>
      <MobileLoading />
      <DesktopLoading />
      <style>{`
        @keyframes dashboardLoadingShimmer {
          0% {
            background-position: 0% 0, 0 0;
          }
          100% {
            background-position: 220% 0, 0 0;
          }
        }

        @keyframes dashboardChasePink {
          0% {
            left: 10px;
            transform: translateY(-50%) scale(0.92);
          }
          25% {
            transform: translateY(-50%) scale(1.05);
          }
          50% {
            left: calc(100% - 46px);
            transform: translateY(-50%) scale(1);
          }
          75% {
            transform: translateY(-50%) scale(1.05);
          }
          100% {
            left: 10px;
            transform: translateY(-50%) scale(0.92);
          }
        }

        @keyframes dashboardChaseBlue {
          0% {
            left: calc(100% - 34px);
            transform: translateY(-50%) scale(1);
            opacity: 0.85;
          }
          25% {
            transform: translateY(-50%) scale(0.9);
          }
          50% {
            left: 12px;
            transform: translateY(-50%) scale(0.95);
            opacity: 1;
          }
          75% {
            transform: translateY(-50%) scale(0.9);
          }
          100% {
            left: calc(100% - 34px);
            transform: translateY(-50%) scale(1);
            opacity: 0.85;
          }
        }
      `}</style>
    </>
  );
}
