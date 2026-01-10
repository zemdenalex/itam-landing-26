import { type JSX, useMemo } from "react";
import "./partners.css";
import { usePartners, useStats } from "../hooks/useApi";

const fallbackLogos = [
    "/images/Vector-2.svg",
    "/images/Vector-3.svg",
    "/images/Vector-4.svg",
    "/images/Vector-5.svg",
    "/images/Vector-6.svg",
    "/images/Vector-7.svg",
    "/images/Vector-8.svg",
    "/images/Vector-9.svg",
    "/images/Vector-10.svg",
    "/images/Vector-11.svg",
    "/images/Vector-12.svg",
    "/images/Vector-13.svg",
];

export default function Partners(): JSX.Element {
    const { data: apiPartners, loading } = usePartners();
    const { data: stats } = useStats();

    // Get stats with fallbacks
    const partnersCount = stats?.partners_count ?? "20+";
    const projectsCount = stats?.partners_projects_count ?? "10+";

    const logos = useMemo(() => {
        if (apiPartners && apiPartners.length > 0) {
            return apiPartners.map(p => p.logo_svg).filter(Boolean) as string[];
        }
        return fallbackLogos;
    }, [apiPartners]);

    return (
        <section className="partners container">
            <div className="partners__layout">
                <header className="partners__header">
                    <div className="partners__eyebrowRow">
                        <div className="partners__dot" />
                        <div className="partners__eyebrow">Партнеры</div>
                    </div>
                    <h2 className="partners__title">С кем мы работали</h2>
                </header>

                <div className="partners__content">
                    <div className="partners__leadWrapper">
                        <p className="partners__lead">
                            Вместе с лучшими ИТ-компаниями мы реализуем масштабные образовательные проекты. Мы открыты к
                            сотрудничеству в различных форматах, направленных на развитие и карьерный рост студентов,
                            а также на поддержку студенческих ИТ-сообществ и проектов.
                        </p>
                    </div>

                    <div className="partners__logosSection">
                        <div className="partners__statsRow">
                            <div className="partners__statCard">
                                <div className="partners__statNumber">{partnersCount}</div>
                                <div className="partners__statText">Компаний-партнеров</div>
                            </div>

                            <div className="partners__statsDivider" />

                            <div className="partners__statCard">
                                <div className="partners__statNumber">{projectsCount}</div>
                                <div className="partners__statText">Совместных проектов</div>
                            </div>
                        </div>
                        <div className="partners__logosViewport" aria-hidden="true">
                            <div className="partners__logosRow partners__logosRow--marquee">
                                {loading ? (
                                    // Show fallback logos while loading
                                    <>
                                        {fallbackLogos.map((src, idx) => (
                                            <img key={`logo-${idx}`} className="partners__logoImage" src={src} alt="Логотип партнёра" />
                                        ))}
                                        {fallbackLogos.map((src, idx) => (
                                            <img key={`logo-dup-${idx}`} className="partners__logoImage" src={src} alt="" />
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {logos.map((src, idx) => (
                                            <img key={`logo-${idx}`} className="partners__logoImage" src={src} alt="Логотип партнёра" />
                                        ))}
                                        {/* Duplicate logos for seamless marquee animation */}
                                        {logos.map((src, idx) => (
                                            <img key={`logo-dup-${idx}`} className="partners__logoImage" src={src} alt="" />
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
