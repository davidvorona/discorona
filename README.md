# Discorona

Discorona is a Discord bot that acts as a server-wide infection simulation. Players can choose to either contain or spread the infection.

## Rules
- discorona initially spawns from  outside media content: images, links, new users, etc
- discorona can spread to users via interaction with an already infected user
- users can choose to protect others from their infection, or spread it knowingly
- the server loses once the infection of a server is complete
- once infection is complete, the bot kills itself and leaves the server (or disables itself)
- the win state is inoculating all users against the coronavirus

## Concepts

1. **Exposure**
	- always when the bot is added to a server
	- always when an infected user from another server joins a server
	- rarely when outside media (images, links, etc.) are posted in a server 

2. **Prevention**
	- an infected user can prevent infection by not interacting entirely (self-isolation)
	- an infected user can prevent infections via the /distance command before interacting (social distancing)
	- an infected user can prevent infection by adding a mask emoji to their own post (face masks)
	- other users can prevent infection by adding a mask emoji to infected posts
	- mods can restrict channels to only non-infected users, so only healthy users can join (travel restrictions)

3. **Transmission**
	- infection spreads via posts to the adjacent posts only, and takes time
	- an infected user can spread infection by interacting without a mask emoji
	- an infected user can use a limited /cough to impose infection on another user

4. **Vaccination**
	- at a certain point, users can get their medical degree and vaccinate users against the virus
	- vaccinations are limited by the amount of vaccines available
	- vaccines are acquired over time, and perhaps by completing certain challenges
	- vaccinated users cannot get infected for a certain period of time

5. **Mutation**
	- at a certain point, infected users can mutate, nullifying vaccines against their interactions
	- mutation happens rarely
	- a mutated user can get other variants of discorona

6. **Eradication**
	- once no users are infected, the infection is considered eradicated
	- eradication means the server beat the infection, and discorona will stop spreading
	- for eradicating, the most active users will get rewards like: vaccines (hide another user's post), etc.
		- these rewards can carry over to the following game

7. **Pandemic**
	- once enough users are infected, discorona has won
	- users that were most active in spreading the virus get rewards like: cough (replace another user's post with coughs), etc.
		- these rewards can carry over to the following game

## Stages

1. **Outbreak**

	During this stage, the infection cannot be put into a win or loss state, and vaccines
cannot be produced. Coughs are more likely to distributed to infected users. The outbreak
stage moves to the containment stage when the number of infected is at least a minimum active
users count determined by message history and a certain period of time has passed. 

2. **Containment**

	During this stage, the infection cannot be put into a win or loss state. Vaccines and coughs
are both distributed, though coughs at a higher rate. The containment stage moves to the
mutation stage when the number of infected goes below half the minimum active user count determined
for the outbreak stage and a certain period of time has passed.

3. **Mutation**

	During this stage, the infection cannot be put into a win or loss state. Vaccines and coughs
are distributed more or less equally.  Discorona can mutate, invalidating previous vaccines
and allowing users to be infected by more than one strain. The mutation stage moves to the
the pandemic stage when the number of infected goes below half the minimum active user or
above double the minimum active user count and a certain period of time has passed.

4. **Pandemic**

	During this stage, the infection *can* be put into a win or loss state. Vaccines and coughs
are distributed more or less equally. Discorona can mutate, invalidating previous vaccines
and allowing users to be infected by more than one strain. The infection ends when a
win/loss state is met.

## Win/Loss State

**Win State:** a winning state is fairly simple. No user in the server can be infected.
If this is the case when outbreak states are checked, then the outbreak is considered
eradicated.

**Lose State:** a losing state is more complicated. We cannot simply check if all
user are infected, since we can't guarantee all users are active. In most cases,
most users are not active, and thus won't get infected. This gives us a few options:

1. After a certain time has passed - this is a poor solution, as it makes the actual
state of loss less tangible, and means the count of infected users could still be low
in the case of a loss.
2. Once all active users are infected - this is a decent solution, but difficult to
implement and not ubiquitous. What determines an active user could be entirely dependent
on the server. This heuristic could be improved by looking at message history for the active
user base, and updating it with new server interactions.
3. Once a minimum count of users are infected for a certain period of time - this is
another decent solution. The count could be dynamically determined based on recent
activity in the server.
4. A mixture of all heuristics - this is the likely solution. Ex: an outbreak, if there are
no changes, should automatically end in a loss state if enough time has passed. Before that
time has passed, however, it could end if a minimum count of users are infected for a
certain period of time.

If an outbreak is in a loss state when checked, then the outbreak is considered endemic.
