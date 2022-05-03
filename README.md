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
	- once all users are infected, discorona has won
	- users that were most active in spreading the virus get rewards like: cough (replace another user's post with coughs), etc.
		- these rewards can carry over to the following game
