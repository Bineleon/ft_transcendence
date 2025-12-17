import { getRouteTail } from "../../router";
import { el, text } from "../home";
import { pongAlert, runAuthBox } from "../utils/alertBox";
import { addUserAsPlayerToTournament, getLoggedName, getTournamentDatas } from "../utils/todb";
import type { Tournament } from "./uiTypes";
import { renderTournamentBrackets } from "./brackets";
import { apiFetch } from "../utils/apiFetch";
import { aliasBox } from "../utils/alertBox";

/// --- HELPER ---- ///
function isUserInTournament(t: Tournament, userName: string): boolean {
  if (!userName) return false;

  return t.matches.some(
    (m) =>
      m.p1User?.user.userName === userName ||
      m.p2User?.user.userName === userName
  );
}

/// ---- VIEW RENDERING ---- ///
function renderRegisterButtons(t: Tournament): HTMLElement {
  const div = el("div", "flex justify-center mb-4 gap-4");

  const joinTournamentBtn = el("button", "btn-click flex mb-4");
  const joinTournamentAsNewBtn = el("button", "btn-click flex mb-4");
  const unregisterFromTournamentBtn = el("button", "btn-click flex mb-4");
  const deleteTournamentBtn = el("button", "btn-click flex mb-4");

  joinTournamentBtn.textContent = "Join as Logged";
  joinTournamentAsNewBtn.textContent = "Join as New";
  unregisterFromTournamentBtn.textContent = "Unregister";
  deleteTournamentBtn.textContent = "Delete Tournament";
  deleteTournamentBtn.classList.add("hidden");

  // Only the creator can see the delete button
  getLoggedName().then((who) => {
    if (!who) {
      joinTournamentBtn.textContent = "Join";
      joinTournamentBtn.onclick = () => {
        // ✅ Reuse your existing auth UI
        runAuthBox("JOIN", { tCode: t.tCode, tournament: t })
          .then(() => {
            document.dispatchEvent(new CustomEvent("tournamentUpdated"));
          })
          .catch((err) => {
            console.error("Auth JOIN error:", err);
          });
      };

      // Join-as-new hidden when not logged (your current rule)
      joinTournamentAsNewBtn.classList.add("hidden");

      unregisterFromTournamentBtn.textContent = "Log in to Unregister";
      unregisterFromTournamentBtn.onclick = () => {
        runAuthBox("LOGIN", { tCode: t.tCode, tournament: t })
          .then(() => {
            document.dispatchEvent(new CustomEvent("tournamentUpdated"));
          })
          .catch((err) => {
            console.error("Auth LOGIN error:", err);
          });
      };
      return;
    }

    if (who === t.creatorName) {
      unregisterFromTournamentBtn.classList.add("hidden");
      deleteTournamentBtn.classList.remove("hidden");
      deleteTournamentBtn.textContent = `Delete Tournament as ${who}`;
      deleteTournamentBtn.onclick = async () => {
        pongAlert("Deleting tournament", "info", {
          title: "Delete",
          onClose: async () => {
            try {
              const response = await apiFetch(`/api/tournaments/${t.tCode}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: t.tCode }),
                credentials: "include",
              });

              const data = await response.json().catch(() => null);

              if (response.ok) {
                pongAlert("Tournament deleted.");
                window.location.hash = "#/tournaments";
              } else {
                pongAlert(
                  `Failed to delete tournament: ${
                    data?.error?.message || data?.message || "Unknown error"
                  }`
                );
              }
            } catch (error) {
              console.error("Delete Tournament Btn error:", error);
              pongAlert(
                `An error occurred: ${
                  error instanceof Error ? error.message : "Network error"
                }`
              );
            }
          },
        });
      };
    }

    const alreadyInTournament = isUserInTournament(t, who);

    if (!alreadyInTournament) {
      joinTournamentAsNewBtn.classList.remove("hidden");

      // ✅ Join as New => use your existing UI (alertBox + players)
      joinTournamentAsNewBtn.onclick = () => {
        runAuthBox("JOIN", { tCode: t.tCode, tournament: t })
          .then(() => {
            document.dispatchEvent(new CustomEvent("tournamentUpdated"));
          })
          .catch((error) => {
            console.error("Join as New error:", error);
            pongAlert(
              `Failed to join as new: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          });
      };

      // Join as logged => same as before
      joinTournamentBtn.onclick = async () => {
        try {
          const resp = await apiFetch(`/api/tournaments/${t.tCode}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userName: who }),
            credentials: "include",
          });

          const data = await resp.json();

          if (resp.ok) {
            document.dispatchEvent(new CustomEvent("tournamentUpdated"));
            aliasBox(`You have been added to the tournament, you may choose an Alias now.`, "success", { title: "Player Added" });
          } else {
            pongAlert(
              `Failed to join tournament: ${
                data?.error?.message || data?.message || "Unknown error"
              }`
            );
          }
        } catch (error) {
          console.error("Join Tournament Btn error:", error);
          pongAlert(
            `An error occurred: ${
              error instanceof Error ? error.message : "Network error"
            }`
          );
        }
      };
    } else if (getNbRegisteredPlayers(getAllPlayerNames(t)) >= t.maxParticipants) {
      joinTournamentBtn.classList.add("hidden");
      joinTournamentAsNewBtn.classList.add("hidden");
    } else {
      joinTournamentBtn.classList.add("hidden");
      joinTournamentAsNewBtn.classList.remove("hidden");

      // ✅ Same “Join as New” UI
      joinTournamentAsNewBtn.onclick = () => {
        runAuthBox("JOIN", { tCode: t.tCode, tournament: t })
          .then(() => {
            document.dispatchEvent(new CustomEvent("tournamentUpdated"));
          })
          .catch((error) => {
            console.error("Join as New error:", error);
            pongAlert(
              `Failed to join as new: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          });
      };
    }

    unregisterFromTournamentBtn.textContent = `Unregister as ${who}`;
    unregisterFromTournamentBtn.onclick = async () => {
      try {
        const response = await apiFetch(`/api/tournaments/${t.tCode}/join`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userName: who }),
          credentials: "include",
        });

        const data = await response.json().catch(() => null);

        if (response.ok) {
          pongAlert("You have been unregistered from the tournament.");
          document.dispatchEvent(new CustomEvent("tournamentUpdated"));
        } else {
          pongAlert(
            `Failed to unregister from tournament: ${
              data?.error?.message || data?.message || "Unknown error"
            }`
          );
        }
      } catch (error) {
        console.error("Unregister error:", error);
        pongAlert(
          `An error occurred: ${
            error instanceof Error ? error.message : "Network error"
          }`
        );
      }
    };
  });

  div.append(joinTournamentAsNewBtn, joinTournamentBtn, unregisterFromTournamentBtn, deleteTournamentBtn);
  return div;
}

function renderTournamentState(t: Tournament): HTMLElement {
  const head = el("div", "grid grid-rows-2");
  const up = el("h1", "font-vintage text-6xl flex justify-center mb-3", text(`${t.name}`));
  const down = el("div", "font-modern-type grid grid-cols-3 place-items-center");
  const infos = el("div", "item-start");

  let nbPlayers = getNbRegisteredPlayers(getAllPlayerNames(t));
  if (nbPlayers > t.maxParticipants) nbPlayers = t.maxParticipants;
  infos.append(el("p", "", text(`Type: ${t.tMode}`)));
  infos.append(el("p", "", text(`Participants: ${nbPlayers} / ${t.maxParticipants}`)));
  const code = el("p", "item-center font-origin-athletic text-3xl", text(`${t.tCode}`));

  let newStatus: string = t.status;
  if (newStatus === "OPEN") newStatus = "Waiting for Players";
  if (newStatus === "RUNNING") newStatus = "Tournament Open";

  const play = el("div", "grid grid-rows-2");
  const status = el("p", "item-end", text(`${newStatus}`));
  const playBtn = el("button", "btn-click p-0");
  playBtn.textContent = "Play";
  playBtn.onclick = () => {
    window.location.href = `#/playpong/${t.tCode}`;
  };

  if (t.status !== "RUNNING") {
    playBtn.disabled = true;
    playBtn.classList.add("bg-stone-300", "cursor-not-allowed");
  }

  play.append(status, playBtn);
  down.append(infos, code, play);
  head.append(up, down);
  return head;
}

function renderTournamentView(t: Tournament): HTMLElement {
  const main = el("div", "border-tournament");
  let tournamentState = renderTournamentState(t) as HTMLElement;
  let tournamentBrackets = renderTournamentBrackets(t) as HTMLElement;
  let registerUnregisterDiv = renderRegisterButtons(t) as HTMLElement;

  main.append(tournamentState, tournamentBrackets, registerUnregisterDiv);

  document.addEventListener("tournamentUpdated", async () => {
    const tCode = getRouteTail("/tournament/classic");
    try {
      const updated = await getTournamentDatas(tCode);

      const newState = renderTournamentState(updated) as HTMLElement;
      tournamentState.replaceWith(newState);
      tournamentState = newState;

      const newBrackets = renderTournamentBrackets(updated) as HTMLElement;
      tournamentBrackets.replaceWith(newBrackets);
      tournamentBrackets = newBrackets;

      const newRegister = renderRegisterButtons(updated) as HTMLElement;
      registerUnregisterDiv.replaceWith(newRegister);
      registerUnregisterDiv = newRegister;
    } catch (err) {
      console.error("Failed to refresh tournament after update:", err);
    }
  });

  return main;
}

/// ---- Helpers ---- ///
function getAllPlayerNames(t: Tournament): string[] {
  const allPlayers: string[] = [];

  for (const match of t.matches) {
    allPlayers.push(match.p1User?.user?.userName ?? "Unassigned");
    allPlayers.push(match.p2User?.user?.userName ?? "Unassigned");
  }
  return allPlayers;
}

function getNbRegisteredPlayers(players: string[]): number {
  return players.filter((name) => name !== "Unassigned").length;
}

/// ---- Main Function ---- ///
export function classicTournament(): HTMLElement {
  // 1) On crée un container immédiat
  const tCode = getRouteTail("/tournament/classic");
  const container = el("div", "");
  const loading = el("p", "article-base text-center", text("Loading tournament..."));
  container.append(loading);

  // 2) On lance le fetch en async, mais SANS rendre la fonction async
  getTournamentDatas(tCode)
    .then((tClassicDatas) => {
      container.innerHTML = "";

      if (!tClassicDatas) {
        const errorDiv = el("div", "article-base text-center");
        errorDiv.append(text("Tournament not found."));
        container.append(errorDiv);
        return;
      }

      if (tClassicDatas.creatorId) {
        const view = renderTournamentView(tClassicDatas);
        container.append(view);
        return container;
      }

      // On Add le user loggué en tant que joueur du tournoi
      // rendre la callback async permet d'utiliser await ici sans rendre classicTournament async
      getLoggedName().then(async (name) => {
        if (!name) return;
        if (isUserInTournament(tClassicDatas, tClassicDatas.creatorName)) return;

        try {
          await addUserAsPlayerToTournament(tCode, name, tClassicDatas);
          // re-fetch et re-render immédiatement après ajout
          tClassicDatas.creatorName = name;
          const updated = await getTournamentDatas(tCode);
          container.innerHTML = "";
          container.append(renderTournamentView(updated));
        } catch (err) {
          console.error("Error adding user to tournament:", err);
        }
      });

      const view = renderTournamentView(tClassicDatas);
      container.append(view);
    })
    .catch((err) => {
      console.error(err);
      container.innerHTML = "";
      container.append(text("Error while loading tournament."));
    });

  return container;
}
