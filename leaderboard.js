document.addEventListener("DOMContentLoaded", () => {
    fetchLeaderboardData();
});

async function fetchLeaderboardData() {
    const leaderboardUrl = "https://tinos-fc-stats.s3.us-east-1.amazonaws.com/leaderboard.json";

    try {
        const response = await fetch(leaderboardUrl);

        if (!response.ok) {
            throw new Error("Failed to fetch leaderboard data");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("Leaderboard data is not an array.");
        }

        populateLeaderboard(data);
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
    }
}

function populateLeaderboard(data) {
    const tableBody = document.querySelector("#player-stats tbody");
    tableBody.innerHTML = ""; // Clear existing rows

    data.forEach(player => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${player.playerName}</td>
            <td>${player.goals}</td>
            <td>${player.assists}</td>
            <td>${player.shots}</td>
            <td>${player.redCards}</td>
            <td>${player.tackleSuccessRate}%</td>
            <td>${player.matchesPlayed}</td>
            <td>${player.averageRating}</td>
        `;

        tableBody.appendChild(row);
    });

    enableSorting();
}

function enableSorting() {
    const table = document.getElementById("player-stats");
    const headers = table.querySelectorAll("th");

    headers.forEach((header, index) => {
        if (!header.classList.contains("non-sortable")) {
            header.addEventListener("click", () => {
                const isAscending = header.classList.contains("ascending");
                const direction = isAscending ? "descending" : "ascending";

                // Remove sorting classes from all headers
                headers.forEach(h => h.classList.remove("ascending", "descending"));

                // Add the new sorting class to the clicked header
                header.classList.add(direction);

                sortTableByColumn(table, index, direction === "ascending");
            });
        }
    });
}

function sortTableByColumn(table, columnIndex, ascending = true) {
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.rows);

    // Sort rows
    const sortedRows = rows.sort((a, b) => {
        const aText = a.cells[columnIndex].textContent.trim();
        const bText = b.cells[columnIndex].textContent.trim();

        // Convert numeric values
        const aValue = isNaN(aText) ? aText : parseFloat(aText);
        const bValue = isNaN(bText) ? bText : parseFloat(bText);

        if (aValue < bValue) return ascending ? -1 : 1;
        if (aValue > bValue) return ascending ? 1 : -1;
        return 0;
    });

    // Append sorted rows back to the table
    sortedRows.forEach(row => tbody.appendChild(row));
}
