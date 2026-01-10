import { type JSX } from "react";
import "./about.css";
import { useStats } from "../hooks/useApi";

export default function About(): JSX.Element {
    const { data: stats } = useStats();

    // Get stats with fallbacks
    const subscribers = stats?.about_subscribers ?? "5.500+";
    const projectsCount = stats?.about_projects_count ?? "30+";
    const clubsCount = stats?.about_clubs_count ?? "7";
    const coursesCount = stats?.about_courses_count ?? "22+";

    return (
        <section className="about container">
            <div className="about__layout">
                <div className="about__header">
                    <div className="about__eyebrowRow">
                        <div className="about__dot" />
                        <div className="about__eyebrow">О нас</div>
                    </div>
                    <h2 className="about__title">Кто мы такие?</h2>
                </div>

                <div className="about__content">
                    <div className="about__leadWrapper">
                        <p className="about__lead">
                            Университет — это тысячи людей. Тысячи талантливых студентов, которые активно развиваются
                            в различных профессиональных сферах. Платформа IT at MISIS (ITAM) помогает студентам,
                            интересующимся информационными технологиями, развиваться в различных областях
                        </p>
                    </div>

                    <div className="about__stats">
                        <div className="about__statCard">
                            <div className="about__statNumber">{subscribers}</div>
                            <div className="about__statText">
                                Подписчиков на всех площадках суммарно
                                < br />
                                (Telegram, VK, Youtube)
                            </div>
                        </div>

                        <div className="about__statCard">
                            <div className="about__statNumber">{projectsCount}</div>
                            <div className="about__statText">
                                Проектов и внутренних
                                <br />
                                мероприятий создано
                                <br />
                                коммьюнити
                            </div>
                        </div>

                        <div className="about__statCard">
                            <div className="about__statNumber">{clubsCount}</div>
                            <div className="about__statText">
                                Клубов, объединенных
                                <br />
                                в одну платформу
                            </div>
                        </div>

                        <div className="about__statCard">
                            <div className="about__statNumber">{coursesCount}</div>
                            <div className="about__statText">
                                Курсов, организованных студентами,
                                <br />
                                для студентов
                            </div>
                        </div>
                    </div>

                    <img
                        className="about__image"
                        src="./images/photo.svg"
                        alt="IT at MISIS"
                    />
                </div>
            </div>
        </section>
    );
}
