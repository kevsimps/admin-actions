import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js"

@customElement("admin-actions")
export class AdminActions extends LitElement {
    static styles = [
        css`
            :host
            {
            display: flex;
            flex-direction: column;
            /* margin-left: 5%; */
            border: solid 3px var(--md-primary-text-color);
            /* width: 90%; */
            padding: 2em;
            color:var(--md-primary-text-color)
            }
        /* :host([darkmode=true]){

                    color:white;
                    border-color:white;
                
            } */
            .title{
            text-align: center
            }
            .config{
            text-align:right;
            margin-right:15px;
            }
            table{
            display:table;
            border-collapse:collapse;
            border-spacing: 0;
            margin-top: 15px;
            }
            tr, th, td{
            border: solid 1px;
            text-align: center;
            }
            .hidden{
            display:none;
            }
        `
    ];
    @property() token?: string    //$STORE.auth.accessToken
    @state() agentList? = []

    async getAgents() {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Authorization", `Bearer ${this.token}`);
        let filter
        filter = {
            and: [
                { isActive: { equals: true } },
                { channelInfo: { channelType: { equals: "telephony" } } }
            ]
        }
        const raw = JSON.stringify({
            "query": "query activeAgents($from: Long!, $to: Long!, $filter: AgentSessionFilters) {\n  agentSession(from: $from, to: $to, filter: $filter) {\n    agentSessions {\n      isActive\n      agentId\n      agentName\n      startTime\n      teamName\n      channelInfo {\n        channelType\n        currentState\n        lastActivityTime\n      }\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n    intervalInfo {\n      interval\n      timezone\n    }\n  }\n}",
            "variables": {
                "from": `${Date.now() - 86400000}`,
                "to": `${Date.now()}`,
                filter

            }
        });
        const requestOptions: any = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        }
        try {
            const response = await fetch(`https://api.wxcc-us1.cisco.com/search`, requestOptions);
            const result = await response.json()
            this.agentList = result.data.agentSession.agentSessions;
            // console.log(results)
            // console.log(this.agentList)
        } catch (error) {
            console.error(error);
        };
    }
    async logOutAgent(e: any) {
        const agentID = e.target.value
        console.log(agentID)
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${this.token}`);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "logoutReason": "Admin Logout",
            "agentId": agentID
        });

        const requestOptions: any = {
            method: "PUT",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        try {
            const response = await fetch("https://api.wxcc-us1.cisco.com/v1/agents/logout", requestOptions);
            const result = await response.text();
            console.log(result)
        } catch (error) {
            console.error(error);
        };
    }
    render() {
        return html`<h1 class="title">Admin Actions</h1>

        <div>
        <button @click=${this.getAgents}>Refresh Agent List</button>
        </div>
        <table>
            <thead>
            <th>Agent Name</th>
            <th>Team</th>
            <th>Log in time</th>
            <th>Status</th>    
            <th>Time in Status</th>
            <th>Action</th>
            </thead>
            ${this.agentList?.map((t: any) => html`
                <tbody>
                    <td>${t.agentName}</td>
                    <td>${t.teamName}</td>
                    <td>${new Date(t.startTime).toLocaleString()}</td>
                    <td>${t.channelInfo[0].currentState}</td>
                      <td>${new Date(Date.now() - t.channelInfo[0].lastActivityTime).toISOString().slice(11, -5)}</td>
                      <td><button value=${t.agentId} @click="${this.logOutAgent}" >Log Out</button></td>                
                </tbody>`)}

        </table>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "admin-actions": AdminActions;
    }
}
