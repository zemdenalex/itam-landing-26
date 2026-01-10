import { type JSX, useMemo } from "react";
import "./clubs.css";
import { useClubs } from "../hooks/useApi";

const fallbackClubs = [
    { name: "Хакатон клуб", slug: "hackathon" },
    { name: "Дизайн клуб", slug: null },
    { name: "AI-knowledge клуб", slug: null },
    { name: "Геймдев клуб", slug: null },
    { name: "Клуб робототехники", slug: null },
    { name: "ACM клуб", slug: null },
    { name: "CTF клуб", slug: null },
];

export default function Clubs(): JSX.Element {
    const { data: apiClubs, loading } = useClubs();

    const clubsList = useMemo(() => {
        if (apiClubs && apiClubs.length > 0) {
            return apiClubs.map(c => ({
                name: c.name,
                slug: c.slug,
            }));
        }
        return fallbackClubs;
    }, [apiClubs]);

    return (
        <section className="clubs" id="clubs">
            <div className="container clubs__container">
                <div className="clubs__layout">
                    <header className="clubs__header">
                        <div className="clubs__eyebrowRow">
                            <div className="clubs__dot" />
                            <div className="clubs__eyebrow">Клубы</div>
                        </div>
                        <h2 className="clubs__title">Наши клубы</h2>
                    </header>

                    <div className="clubs__listWrapper">
                        <div className="clubs__list">
                            {loading ? (
                                <div className="clubs__loading">Загрузка...</div>
                            ) : (
                                clubsList.map((club) => {
                                    const content = (
                                        <>
                                            <img
                                                className="clubs__iconArrowRight"
                                                src="./images/Union.svg"
                                                alt=""
                                            />
                                            <div className="clubs__itemLabel">{club.name}</div>
                                        </>
                                    );

                                    // Make club clickable if it has a slug
                                    if (club.slug) {
                                        return (
                                            <a
                                                className="clubs__item"
                                                href={`/club/${club.slug}`}
                                                key={club.name}
                                            >
                                                {content}
                                            </a>
                                        );
                                    }

                                    return (
                                        <div className="clubs__item" key={club.name}>
                                            {content}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                <img className="clubs__img" src="./images/3d-element.svg" alt="core" />
            </div>

        </section>
    );
}
