import { type JSX, useMemo } from "react";
import "./team.css";
import ArrowButton from "./ArrowButton";
import { useTeam } from "../hooks/useApi";

const PLACEHOLDER_IMAGE = "https://placehold.co/162x162";
const PLACEHOLDER_LARGE = "https://placehold.co/350x350";

interface TeamMemberDisplay {
    photo: string;
    name: string;
    isLarge: boolean;
}

function TeamRow({ members }: { members: TeamMemberDisplay[] }): JSX.Element {
    // Organize members into pattern: large, cluster(4), large, cluster(4), etc.
    const organized = useMemo(() => {
        const result: JSX.Element[] = [];
        let memberIndex = 0;

        // Pattern: large card, then 4 small cards in a cluster, repeat
        while (memberIndex < members.length) {
            // Add a large card
            if (memberIndex < members.length) {
                const member = members[memberIndex];
                result.push(
                    <div className="team__cardLarge" key={`large-${memberIndex}`}>
                        <img
                            className="team__cardLargeImage"
                            src={member.photo || PLACEHOLDER_LARGE}
                            alt={member.name}
                        />
                    </div>
                );
                memberIndex++;
            }

            // Add a cluster of 4 small cards
            const clusterMembers: TeamMemberDisplay[] = [];
            for (let i = 0; i < 4 && memberIndex < members.length; i++) {
                clusterMembers.push(members[memberIndex]);
                memberIndex++;
            }

            if (clusterMembers.length > 0) {
                result.push(
                    <div className="team__cluster" key={`cluster-${memberIndex}`}>
                        {clusterMembers.map((member, idx) => (
                            <div className="team__avatarWrapper" key={`avatar-${memberIndex}-${idx}`}>
                                <img
                                    className="team__avatar"
                                    src={member.photo || PLACEHOLDER_IMAGE}
                                    alt={member.name}
                                />
                            </div>
                        ))}
                        {/* Fill remaining slots with placeholders if needed */}
                        {Array.from({ length: 4 - clusterMembers.length }).map((_, idx) => (
                            <div className="team__avatarWrapper" key={`placeholder-${memberIndex}-${idx}`}>
                                <img
                                    className="team__avatar"
                                    src={PLACEHOLDER_IMAGE}
                                    alt=""
                                />
                            </div>
                        ))}
                    </div>
                );
            }
        }

        return result;
    }, [members]);

    return (
        <div className="team__gridRow">
            {organized}
        </div>
    );
}

function FallbackTeamRow(): JSX.Element {
    return (
        <div className="team__gridRow">
            <div className="team__cardLarge">
                <img
                    className="team__cardLargeImage"
                    src={PLACEHOLDER_LARGE}
                    alt=""
                />
            </div>

            <div className="team__cluster">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div className="team__avatarWrapper" key={`cluster-1-${index}`}>
                        <img
                            className="team__avatar"
                            src={PLACEHOLDER_IMAGE}
                            alt=""
                        />
                    </div>
                ))}
            </div>

            <div className="team__cardLarge">
                <img
                    className="team__cardLargeImage"
                    src={PLACEHOLDER_LARGE}
                    alt=""
                />
            </div>

            <div className="team__cluster">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div className="team__avatarWrapper" key={`cluster-2-${index}`}>
                        <img
                            className="team__avatar"
                            src={PLACEHOLDER_IMAGE}
                            alt=""
                        />
                    </div>
                ))}
            </div>

            <div className="team__cardLarge">
                <img
                    className="team__cardLargeImage"
                    src={PLACEHOLDER_LARGE}
                    alt=""
                />
            </div>

            <div className="team__cluster">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div className="team__avatarWrapper" key={`cluster-3-${index}`}>
                        <img
                            className="team__avatar"
                            src={PLACEHOLDER_IMAGE}
                            alt=""
                        />
                    </div>
                ))}
            </div>

            <div className="team__cardLarge">
                <img
                    className="team__cardLargeImage"
                    src={PLACEHOLDER_LARGE}
                    alt=""
                />
            </div>
        </div>
    );
}

export default function Team(): JSX.Element {
    const { data: teamMembers, loading } = useTeam();

    const displayMembers: TeamMemberDisplay[] = useMemo(() => {
        if (!teamMembers || teamMembers.length === 0) return [];
        return teamMembers.map(m => ({
            photo: m.photo || PLACEHOLDER_IMAGE,
            name: m.name,
            isLarge: false, // Could add a badge check here
        }));
    }, [teamMembers]);

    const hasMembers = displayMembers.length > 0;

    return (
        <section className="team">
            <div className="container team__container">
                <div className="team__headerRow">
                    <header className="team__header">
                        <div className="team__eyebrowRow">
                            <div className="team__dot" />
                            <div className="team__eyebrow">Команда</div>
                        </div>
                        <h2 className="team__title">Наше сообщество</h2>
                    </header>

                    <ArrowButton
                        className="team__moreButton"
                        href="/team"
                        label="Подробнее"
                        labelClassName="team__moreLabel"
                        iconClassName="team__moreIcon"
                    />
                </div>

            </div>
            <div className="team__carouselViewport" aria-hidden="true">
                <div className="team__carouselRow">
                    {loading || !hasMembers ? (
                        <>
                            <FallbackTeamRow />
                            <FallbackTeamRow />
                        </>
                    ) : (
                        <>
                            <TeamRow members={displayMembers} />
                            <TeamRow members={displayMembers} />
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
