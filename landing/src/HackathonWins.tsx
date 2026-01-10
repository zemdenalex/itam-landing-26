import { type JSX, useMemo, useState } from "react";
import Header from "./components/Header";
import { useWins } from "./hooks/useApi";
import "./App.css";
import "./hackathon-wins.css";

type HackResult = {
    event: string;
    team: string;
    place: string;
    year: number;
    awardDate: string;
    link?: string;
};

const YEARS = ["Все", "2026", "2025", "2024", "2023"] as const;

export default function HackathonWins(): JSX.Element {
    const { data: winsData, loading, error } = useWins();
    const [activeYear, setActiveYear] = useState<string>("Все");

    const data: HackResult[] = useMemo(() => {
        if (!winsData) return [];
        
        return winsData
            .map((win) => ({
                event: win.hackathon_name,
                team: win.team_name,
                place: win.result,
                year: win.year,
                awardDate: win.award_date || "",
                link: win.link || undefined,
            }))
            .sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                const parseDate = (d: string, y: number) => {
                    if (!d) return new Date(y, 0, 1).getTime();
                    const [day, month, year] = d.split(".").map(Number);
                    return day && month && year ? new Date(year, month - 1, day).getTime() : new Date(y, 0, 1).getTime();
                };
                return parseDate(b.awardDate, b.year) - parseDate(a.awardDate, a.year);
            });
    }, [winsData]);

    const filteredData = useMemo(() => {
        if (activeYear === "Все") return data;
        return data.filter((item) => item.year === Number(activeYear));
    }, [data, activeYear]);

    return (
        <div className="page" id="hackathon-wins">
            <Header />
            <main>
                <section className="wins">
                    <div className="wins__container">
                        <header className="container wins__hero">
                            <h1 className="wins__title">Хакатон победы</h1>
                            <div className="wins__filters">
                                {YEARS.map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        className={`wins__filter ${activeYear === year ? "wins__filter--active" : ""}`}
                                        onClick={() => setActiveYear(year)}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </header>

                        <div className="wins__table">
                            <div className="wins__tableHeader container">
                                <div className="wins__headerCell wins__headerCell--event">Название хакатона</div>
                                <div className="wins__headerCell wins__headerCell--team">Название команды</div>
                                <div className="wins__headerCell wins__headerCell--place">Место</div>
                            </div>

                            <div className="wins__rows">
                                {loading && <div className="wins__empty container">Загрузка...</div>}
                                {error && <div className="wins__empty container">Ошибка загрузки данных</div>}
                                
                                {!loading && !error && filteredData.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`wins__rowGroup${item.link ? " wins__rowGroup--clickable" : ""}`}
                                        onClick={item.link ? () => window.open(item.link, "_blank") : undefined}
                                    >
                                        <div className="wins__row container">
                                            <div className="wins__cell wins__cell--event">{item.event}</div>
                                            <div className="wins__cell wins__cell--team">{item.team}</div>
                                            <div className="wins__cell wins__cell--place">{item.place}</div>
                                        </div>
                                    </div>
                                ))}

                                {!loading && !error && filteredData.length === 0 && (
                                    <div className="wins__empty container">Нет данных за выбранный год</div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}