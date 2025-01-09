const bucketUrl = "https://tinos-fc-stats.s3.us-east-1.amazonaws.com/";
const matchesPerPage = 10; // Limit matches per page
let currentPage = 1;
let matches = []; // Store all matches

async function fetchMatchResults() {
    try {
        const response = await fetch(`${bucketUrl}?list-type=2&prefix=gameLogs/`);
        const text = await response.text();

        // Extract file details from the raw response
        const fileEntries = Array.from(text.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)).map(
            (entry) => entry[1]
        );

        if (fileEntries.length === 0) {
            document.getElementById("matches").innerHTML = "<p>No match data available.</p>";
            return;
        }

        // Parse filenames and last modified dates
        const files = fileEntries.map((entry) => {
            const fileNameMatch = entry.match(/<Key>(gameLogs\/[a-zA-Z0-9_.-]+\.json)<\/Key>/);
            const lastModifiedMatch = entry.match(/<LastModified>([^<]+)<\/LastModified>/);

            return {
                name: fileNameMatch ? fileNameMatch[1] : null,
                lastModified: lastModifiedMatch ? new Date(lastModifiedMatch[1]) : null,
            };
        });

        // Filter out invalid entries
        const validFiles = files.filter((file) => file.name && file.lastModified);

        // Sort files by lastModified in descending order
        validFiles.sort((a, b) => b.lastModified - a.lastModified);

        // Fetch match details from valid files
        const matchPromises = validFiles.map(async (file) => {
            const matchResponse = await fetch(`${bucketUrl}${file.name}`);
            if (!matchResponse.ok) {
                console.error(`Failed to fetch ${file.name}:`, matchResponse.statusText);
                return null;
            }
            const matchData = await matchResponse.json();
            return {
                matchId: matchData.matchId,
                staticTeamName: matchData.staticTeamName || "Tinos",
                dynamicTeamName: matchData.dynamicTeamName || "Unknown",
                staticTeamScore: matchData.staticTeamScore || 0,
                dynamicTeamScore: matchData.dynamicTeamScore || 0,
                staticTeamImageId: matchData.staticTeamImageId || null,
                winnerByForfeit: matchData.winnerByForfeit,
                playerStats: matchData.playerStats || [],
                lastModified: file.lastModified,
            };
        });

        matches = (await Promise.all(matchPromises)).filter(Boolean);

        renderMatches();
    } catch (error) {
        console.error("Error fetching match files:", error);
        document.getElementById("matches").innerHTML =
            "<p>Failed to load match data.</p>";
    }
}

function renderMatches() {
    const container = document.getElementById("matches");
    container.innerHTML = ""; // Clear previous data

    if (matches.length === 0) {
        container.innerHTML = "<p>No match data available.</p>";
        return;
    }

    const startIndex = (currentPage - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    const currentMatches = matches.slice(startIndex, endIndex);

    currentMatches.forEach((match) => {
        const matchCard = document.createElement("div");
        matchCard.classList.add("match-card");

        const resultClass =
            match.staticTeamScore > match.dynamicTeamScore
                ? "win"
                : match.staticTeamScore < match.dynamicTeamScore
                ? "loss"
                : "draw";

        const timeAgo = formatTimeAgo(match.lastModified);

        matchCard.innerHTML = `
            <div class="team">${match.staticTeamName}</div>
            <div class="result ${resultClass}">
                ${match.staticTeamScore}-${match.dynamicTeamScore}
            </div>
            <div class="team">${match.dynamicTeamName}</div>
            <div class="time">${timeAgo}</div>
        `;

        container.appendChild(matchCard);
    });

    renderPagination();
}

function renderPagination() {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = ""; // Clear previous pagination

    const totalPages = Math.ceil(matches.length / matchesPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        pageButton.classList.add("page-button");
        if (i === currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => {
            currentPage = i;
            renderMatches();
        });
        paginationContainer.appendChild(pageButton);
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

// Fetch and display match results
fetchMatchResults();
