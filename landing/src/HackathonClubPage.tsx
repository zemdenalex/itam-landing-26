import { type JSX } from "react";
import Header from "./components/Header";
import "./App.css";
import "./hackathon-club.css";

export default function HackathonClubPage(): JSX.Element {
    return (
        <div className="page">
            <Header />
            <main>
                <section className="hackClub">
                    <div className="hackClub__hero">
                        <img
                            className="hackClub__heroImage"
                            src="https://placehold.co/960x975"
                            alt=""
                        />

                        <div className="container hackClub__heroContent">
                            <div className="hackClub__heroInner">
                                <h1 className="hackClub__title">Хакатон клуб</h1>

                                <div className="hackClub__buttonsRow">
                                    <button
                                        type="button"
                                        className="hackClub__primaryButton"
                                    >
                                        <span className="hackClub__primaryLabel">Чат клуба</span>
                                        <span className="hackClub__primaryIcon" />
                                    </button>
                                    <button
                                        type="button"
                                        className="hackClub__primaryButton"
                                    >
                                        <span className="hackClub__primaryLabel">Канал клуба</span>
                                        <span className="hackClub__primaryIcon" />
                                    </button>
                                </div>

                                <div className="hackClub__statsRow">
                                    <div className="hackClub__statsCards">
                                        <div className="hackClub__statCard">
                                            <div className="hackClub__statNumber">1800+</div>
                                            <div className="hackClub__statLabel">
                                                Участников клуба
                                            </div>
                                        </div>
                                        <div className="hackClub__statCard">
                                            <div className="hackClub__statNumber">15+</div>
                                            <div className="hackClub__statLabel">
                                                Мероприятий
                                            </div>
                                        </div>
                                        <div className="hackClub__statCard">
                                            <div className="hackClub__statNumber">124</div>
                                            <div className="hackClub__statLabel">
                                                Побед на хакатонах
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hackClub__markRow">
                                        <span className="hackClub__mark hackClub__mark--long" />
                                        <span className="hackClub__mark hackClub__mark--mid" />
                                        <span className="hackClub__mark hackClub__mark--short" />
                                        <span className="hackClub__mark hackClub__mark--short" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hackClub__section hackClub__section--neutral">
                        <div className="container hackClub__sectionInner">
                            <div className="hackClub__textBlock">
                                <h2 className="hackClub__sectionTitle">Описание</h2>
                                <p className="hackClub__text">
                                    Хакатон-клуб НИТУ МИСИС — это динамичное сообщество студентов,
                                    специализирующееся на участии в технологических конкурсах и
                                    хакатонах. Студенты, состоящие в клубе, нацелены на развитие своих
                                    профессиональных навыков и компетенций через практический опыт в
                                    решении реальных бизнес-задач. Сообщество способствует
                                    академическому и профессиональному росту участников и служит
                                    платформой для создания инновационных IT‑проектов.
                                </p>
                            </div>

                            <div className="hackClub__imagesRow hackClub__imagesRow--wide">
                                <img
                                    className="hackClub__imageLarge"
                                    src="https://placehold.co/728x410"
                                    alt=""
                                />
                                <img
                                    className="hackClub__imageLarge"
                                    src="https://placehold.co/728x410"
                                    alt=""
                                />
                            </div>

                            <div className="hackClub__textBlock">
                                <h2 className="hackClub__sectionTitle">Цель клуба</h2>
                                <p className="hackClub__text">
                                    Участники клуба получают опыт работы с бизнес-заказчиками,
                                    менторами и инвесторами напрямую, без посредников. Клуб даёт
                                    возможность разрабатывать реальные IT‑решения в сжатые сроки,
                                    прокачивая навык быстрых решений и адаптации к изменениям. Команды
                                    работают в мультидисциплинарном составе: программисты, аналитики,
                                    дизайнеры и продакт‑менеджеры.
                                </p>
                            </div>

                            <div className="hackClub__imagesRow">
                                <img
                                    className="hackClub__imageMedium"
                                    src="https://placehold.co/485x273"
                                    alt=""
                                />
                                <img
                                    className="hackClub__imageMedium"
                                    src="https://placehold.co/485x273"
                                    alt=""
                                />
                                <img
                                    className="hackClub__imageMedium"
                                    src="https://placehold.co/485x273"
                                    alt=""
                                />
                            </div>
                        </div>
                    </div>

                    <div className="hackClub__section">
                        <div className="container hackClub__sectionInner hackClub__sectionInner--column">
                            <h2 className="hackClub__sectionHeading">Проекты</h2>

                            <div className="hackClub__projectsRow">
                                <article className="hackClub__projectCard">
                                    <img
                                        className="hackClub__projectImage"
                                        src="https://placehold.co/728x413"
                                        alt="Хакатон курсов"
                                    />
                                    <div className="hackClub__projectFooter">
                                        <div className="hackClub__projectInfo">
                                            <h3 className="hackClub__projectTitle">
                                                Хакатон курсов
                                            </h3>
                                            <div className="hackClub__tagsRow">
                                                <span className="hackClub__tag">МИСИС</span>
                                                <span className="hackClub__tag">Курсы</span>
                                                <span className="hackClub__tag">Хакатон</span>
                                            </div>
                                        </div>
                                        <div className="hackClub__projectIcon">
                                            <span className="hackClub__projectIconDot" />
                                        </div>
                                    </div>
                                </article>

                                <article className="hackClub__projectCard">
                                    <img
                                        className="hackClub__projectImage"
                                        src="https://placehold.co/728x413"
                                        alt="Креатон"
                                    />
                                    <div className="hackClub__projectFooter">
                                        <div className="hackClub__projectInfo">
                                            <h3 className="hackClub__projectTitle">Креатон</h3>
                                            <div className="hackClub__tagsRow">
                                                <span className="hackClub__tag">МИСИС</span>
                                                <span className="hackClub__tag">Курсы</span>
                                                <span className="hackClub__tag">Дизайн</span>
                                            </div>
                                        </div>
                                        <div className="hackClub__projectIcon">
                                            <span className="hackClub__projectIconDot" />
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </div>

                    <div className="hackClub__section">
                        <div className="container hackClub__sectionInner hackClub__sectionInner--column">
                            <h2 className="hackClub__sectionHeading">Команда</h2>

                            <div className="hackClub__teamGrid">
                                <div className="hackClub__teamRow">
                                    <article className="hackClub__leaderCard">
                                        <img
                                            className="hackClub__leaderAvatar"
                                            src="https://placehold.co/300x300"
                                            alt="Ефимов Даниил"
                                        />
                                        <div className="hackClub__leaderText">
                                            <div className="hackClub__leaderName">
                                                Ефимов Даниил
                                            </div>
                                            <div className="hackClub__leaderRole">
                                                Руководитель клуба
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="hackClub__contactButton"
                                        >
                                            <span className="hackClub__contactLabel">Связаться</span>
                                            <span className="hackClub__contactIcon" />
                                        </button>
                                    </article>

                                    <article className="hackClub__leaderCard">
                                        <img
                                            className="hackClub__leaderAvatar"
                                            src="https://placehold.co/300x300"
                                            alt="Фамилия Дмитрий"
                                        />
                                        <div className="hackClub__leaderText">
                                            <div className="hackClub__leaderName">
                                                Фамилия Дмитрий
                                            </div>
                                            <div className="hackClub__leaderRole">
                                                Зам. руководитель клуба
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="hackClub__contactButton"
                                        >
                                            <span className="hackClub__contactLabel">Связаться</span>
                                            <span className="hackClub__contactIcon" />
                                        </button>
                                    </article>
                                </div>

                                <div className="hackClub__teamRow hackClub__teamRow--small">
                                    <article className="hackClub__memberCard">
                                        <img
                                            className="hackClub__memberAvatar"
                                            src="https://placehold.co/100x100"
                                            alt="Кристина Егорова"
                                        />
                                        <div className="hackClub__memberText">
                                            <div className="hackClub__memberName">
                                                Кристина Егорова
                                            </div>
                                            <div className="hackClub__memberRole">Graph</div>
                                        </div>
                                    </article>

                                    <article className="hackClub__memberCard">
                                        <img
                                            className="hackClub__memberAvatar"
                                            src="https://placehold.co/100x100"
                                            alt="Максим Фамилия"
                                        />
                                        <div className="hackClub__memberText">
                                            <div className="hackClub__memberName">
                                                Максим Фамилия
                                            </div>
                                            <div className="hackClub__memberRole">
                                                Product | Graph | Motion
                                            </div>
                                        </div>
                                    </article>

                                    <article className="hackClub__memberCard">
                                        <img
                                            className="hackClub__memberAvatar"
                                            src="https://placehold.co/100x100"
                                            alt="Ранель"
                                        />
                                        <div className="hackClub__memberText">
                                            <div className="hackClub__memberName">Ранель</div>
                                            <div className="hackClub__memberRole">
                                                Product | Graph
                                            </div>
                                        </div>
                                    </article>

                                    <article className="hackClub__memberCard">
                                        <img
                                            className="hackClub__memberAvatar"
                                            src="https://placehold.co/100x100"
                                            alt="Фамилия Екатерина"
                                        />
                                        <div className="hackClub__memberText">
                                            <div className="hackClub__memberName">
                                                Фамилия Екатерина
                                            </div>
                                            <div className="hackClub__memberRole">Graph</div>
                                        </div>
                                    </article>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

