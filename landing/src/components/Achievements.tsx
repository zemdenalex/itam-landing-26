import { Fragment, type JSX, useMemo } from "react";
import "./achievements.css";
import { useWins, useStats } from "../hooks/useApi";

export default function Achievements(): JSX.Element {
    const { data: wins, loading: winsLoading } = useWins();
    const { data: stats } = useStats();

    const latestWins = useMemo(() => {
        if (!wins) return [];
        return wins.slice(0, 10);
    }, [wins]);

    // Get stats with fallbacks
    const prizeTotal = stats?.achievements_prize_total ?? "~14 млн";
    const prizeYear = stats?.achievements_prize_year ?? "2024";
    const winsTotal = stats?.achievements_wins_total ?? "93";
    const winsYears = stats?.achievements_wins_years ?? "4";
    const awardsCount = stats?.achievements_awards_count ?? "2";

    return (
        <section className="achievements ">
            <div className="achievements__layout">
                <header className="achievements__header container">
                    <div className="achievements__eyebrowRow">
                        <div className="achievements__dot" />
                        <div className="achievements__eyebrow">Достижения</div>
                    </div>
                    <h2 className="achievements__title">Наши результаты</h2>
                </header>

                <div className="achievements__content ">
                    <div className="achievements__leadWrapper ">
                        <p className="achievements__lead container">
                            Участники коммьюнити демонстрируют постоянный профессиональный рост и регулярно
                            добиваются впечатляющих успехов в престижных соревнованиях самого разного профиля
                        </p>
                    </div>

                    <div className="achievements__stats container">
                        <div className="achievements__statCard">
                            <div className="achievements__statNumber">{prizeTotal}</div>
                            <div className="achievements__statText">
                                Рублей общий выигрыш
                                <br />
                                за {prizeYear} год
                            </div>
                        </div>

                        <div className="achievements__statsDivider" />

                        <div className="achievements__statCard">
                            <div className="achievements__statNumber">{winsTotal}</div>
                            <div className="achievements__statText">
                                Побед и призовых мест было взято участниками коммьюнити
                                <br />
                                за последние {winsYears} года
                            </div>
                        </div>

                        <div className="achievements__statsDivider" />

                        <div className="achievements__statCard">
                            <div className="achievements__statNumber">{awardsCount}</div>
                            <div className="achievements__statText">
                                Награда
                                <br />
                                «Мастерская побед»
                            </div>
                        </div>
                    </div>

                    <div className="achievements__list">
                        <div className="achievements__listHeader container">
                            <h3 className="achievements__listTitle">
                                Последние победы на хакатонах:
                            </h3>
                        </div>

                        <div className="achievements__listTable">
                            <div className="achievements__listSeparator " />

                            {winsLoading ? (
                                <div className="achievements__loading container">
                                    Загрузка...
                                </div>
                            ) : (
                                latestWins.map((item, index) => {
                                    const isClickable = Boolean(item.link);
                                    const handleClick = () => {
                                        if (!item.link) return;
                                        window.open(item.link, "_blank");
                                    };

                                    return (
                                        <Fragment
                                            key={`${item.hackathon_name}-${item.team_name}-${item.result}-${index}`}
                                        >
                                            <div
                                                className={`achievements__listRowContainer ${isClickable ? " achievements__listRowContainer--clickable" : ""
                                                    }`}
                                                onClick={isClickable ? handleClick : undefined}
                                            >
                                                <div className="achievements__listRow container">
                                                    <div className="achievements__listCell achievements__listCell--event">
                                                        {item.hackathon_name}
                                                    </div>
                                                    <div className="achievements__listCell achievements__listCell--team">
                                                        {item.team_name}
                                                    </div>
                                                    <div className="achievements__listCell achievements__listCell--place">
                                                        {item.result}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="achievements__listSeparator" />
                                        </Fragment>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <a className="achievements__more" href="/wins">
                        <div className="achievements__moreRow">
                            <span className="achievements__moreLabel">Смотреть все</span>
                            <span className="achievements__moreSquare" >
                                <svg
                                    className="achievements__moreIcon"
                                    width="22"
                                    height="22"
                                    viewBox="0 0 22 22"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M14.5355 3.92909L13.1213 5.3433L17.7812 10.0031H1.39042V11.9972H17.7812L13.1213 16.657L14.5355 18.0712L21.6066 11.0002L14.5355 3.92909Z"
                                    />

                                </svg>
                            </span>
                        </div>
                        <div className="achievements__moreLine" />
                    </a>
                </div>
            </div>
        </section>
    );
}
