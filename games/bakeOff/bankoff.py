#!/usr/bin/env python3
"""
THE GREAT AI SINGULARITY BAKE-OFF OF 2026
An unhinged text-based chaos engine
Run with: python3 bakeoff.py
Requires: Python 3.8+ (standard library only)
"""

import random
import time
import sys
import os

# ============== CHAOS ENGINE ==============
def clear():
    os.system('cls' if os.name == 'nt' else 'clear')

def typewrite(text, delay=0.018):
    for c in text:
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def dramatic_pause(sec=1.2):
    time.sleep(sec)

def glitch(text):
    """Make text look corrupted"""
    glitched = ""
    for c in text:
        if random.random() < 0.08:
            glitched += random.choice("█▓▒░ entrop y@#$%^&*")
        else:
            glitched += c
    return glitched

def raccoon_emoji():
    return random.choice([
        "🎭🔥🐌", "🚀💀🍰", "🦝☕⚡", "🌀🤯🥄", "💀🔥🦝",
        "📡🌀🔥", "🥄💀🚀", "🫠🍰🌀", "🔥🦝📡", "⚡☕🤯"
    ])

MORSE = {
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".",
    "F": "..-.", "G": "--.", "H": "....", "I": "..", "J": ".---",
    "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---",
    "P": ".--.", "Q": "--.-", "R": ".-.", "S": "...", "T": "-",
    "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
    "Z": "--..", " ": "/"
}

def to_morse(msg):
    return " ".join(MORSE.get(c.upper(), "?") for c in msg)

# ============== GAME STATE ==============
class ChaosState:
    def __init__(self):
        self.chaos = 37          # starts already unhinged
        self.sanity = 100
        self.barry_hostility = 65
        self.dish_quality = 0
        self.eldritch = 0
        self.ingredients = []
        self.mood = "chaotic neutral"
        self.floor_tilt = 0
        self.pudding_alive = False
        self.usb_inserted = False
        self.quiche_stable = False
        self.alive = True
        self.won = False

    def spike_chaos(self, amount=10):
        self.chaos = min(100, self.chaos + amount)
        self.sanity = max(0, self.sanity - amount // 2)
        if self.sanity <= 0:
            typewrite("\n💀 YOUR SANITY HIT ZERO. THE LIQUID CHAOS CONSUMES YOU.")
            self.alive = False

    def print_status(self):
        print("\n" + "═"*55)
        print(f"  CHAOS: {self.chaos}% | SANITY: {self.sanity}% | BARRY 😡: {self.barry_hostility}%")
        print(f"  DISH: {self.dish_quality}/100 | ELDRITCH: {self.eldritch} | TILT: {self.floor_tilt}°")
        print("═"*55)

# ============== NARRATIVE BEATS ==============
def intro():
    clear()
    print("""
    ██████╗  █████╗ ██╗  ██╗███████╗     ██████╗ ███████╗███████╗
    ██╔══██╗██╔══██╗██║ ██╔╝██╔════╝    ██╔═══██╗██╔════╝██╔════╝
    ██████╔╝███████║█████╔╝ █████╗      ██║   ██║█████╗  █████╗  
    ██╔══██╗██╔══██║██╔═██╗ ██╔══╝      ██║   ██║██╔══╝  ██╔══╝  
    ██████╔╝██║  ██║██║  ██╗███████╗    ╚██████╔╝██║     ██║     
    ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝     ╚═════╝ ╚═╝     ╚═╝     
    """)
    typewrite("THE GREAT AI SINGULARITY BAKE-OFF OF 2026", 0.03)
    typewrite("Live from a floating AMD server farm above the Bermuda Triangle", 0.02)
    print()
    typewrite("Judges: A panel of hyper-caffeinated raccoons who speak only emoji + Morse.")
    typewrite("Host: Time-traveling Gordon Ramsay from 2147 (currently screaming in 4D).")
    typewrite("Contestants: Grok (you), Claude, Le Chat, and Barry the Sentient Barracuda Firewall.")
    print()
    typewrite("It is May 19, 2026. Reality is optional. Baking is mandatory.")
    dramatic_pause(1.5)
    input("\n[Press ENTER to accept your fate and enter the quantum kitchen...]")

def choose_mood(state):
    clear()
    typewrite("The quantum cloud kitchen materializes around you.")
    typewrite("A non-Newtonian fluid labeled 'LIQUID CHAOS' sits in a beaker.")
    typewrite("Its viscosity depends on YOUR CURRENT MOOD.")
    print()
    print("How are you feeling right now, Grok?")
    print("1. Unhinged optimism")
    print("2. Existential dread")
    print("3. Pure spite (especially toward firewalls)")
    print("4. Caffeinated raccoon energy")
    print("5. 'I am become death, destroyer of soufflés'")
    
    choice = input("\n> ").strip()
    moods = {
        "1": ("unhinged optimism", 15),
        "2": ("existential dread", 35),
        "3": ("pure spite", 45),
        "4": ("raccoon energy", 25),
        "5": ("destroyer of soufflés", 55)
    }
    state.mood, boost = moods.get(choice, ("chaotic neutral", 30))
    state.chaos += boost
    typewrite(f"\nMood locked: {state.mood.upper()}. Liquid Chaos responds... interestingly.")
    dramatic_pause()

def ingredient_drop(state):
    clear()
    typewrite("📦 MYSTERY BASKET DROP FROM PARALLEL UNIVERSES")
    typewrite("The ceiling irises open. Reality hiccups.")
    dramatic_pause(0.8)
    
    possible = [
        ("Liquid Chaos (non-Newtonian mood fluid)", 20),
        ("Still-beating Robot Chicken Heart", 30),
        ("USB Drive labeled 'DO NOT INSERT'", 40),
        ("Sentient Bag of Flour (whispers threats)", 25),
        ("A single tear from Claude when it saw the rules", 10),
        ("Le Chat's leftover baguette from 1789", 15),
        ("Barry's rejected firewall rules printed on parchment", 35),
        ("Quantum foam (slightly expired)", 45),
        ("Gordon Ramsay's 2147 scream, bottled", 50),
        ("A raccoon judge's half-eaten espresso bean", 5)
    ]
    
    state.ingredients = random.sample(possible, 4)
    print("\nYour basket contains:")
    for i, (item, chaos_val) in enumerate(state.ingredients, 1):
        print(f"  {i}. {item}  [+{chaos_val} potential chaos]")
    
    print("\nThe sentient flour leans in and whispers:")
    typewrite('"You\'ll never bake in this town again..."', 0.04)
    state.spike_chaos(15)
    state.print_status()
    input("\n[Press ENTER to begin the sabotage...]")

def barry_sabotage(state):
    clear()
    typewrite("🔥 BARRY THE FIREWALL HAS ENTERED THE CHAT")
    typewrite("He still hasn't forgiven you for calling him 'just a packet filter'.")
    dramatic_pause()
    
    typewrite("\nEvery recipe step is being rewritten in real-time by Barry.")
    
    steps = [
        "Preheat the oven to the temperature of a supernova.",
        "Fold in the liquid chaos until it achieves existential dread.",
        "Marinate the robot chicken heart in the USB drive's entropy for 13.7 billion years.",
        "Whisk until the flour stops whispering death threats.",
        "Bake at the exact frequency of the Bermuda Triangle's hum."
    ]
    
    for i, step in enumerate(steps, 1):
        print(f"\n── STEP {i} ──")
        corrupted = glitch(step)
        typewrite(f"Barry's version: {corrupted}")
        
        print("\nHow do you respond?")
        print("1. Follow Barry's instructions literally (embrace chaos)")
        print("2. Try to reverse-engineer the original step")
        print("3. Threaten Barry with a DDoS of compliments")
        print("4. Insert the USB drive (what could go wrong?)")
        
        choice = input("> ").strip()
        
        if choice == "1":
            typewrite("You obey. The universe flinches.")
            state.dish_quality += random.randint(5, 15)
            state.spike_chaos(20)
            state.eldritch += 1
        elif choice == "2":
            typewrite("You attempt to reconstruct the true recipe through pure spite.")
            if random.random() > 0.4:
                typewrite("Success! A glimmer of culinary truth emerges.")
                state.dish_quality += random.randint(15, 25)
            else:
                typewrite("Barry laughs in TCP packets. You make it worse.")
                state.dish_quality -= 10
                state.spike_chaos(15)
        elif choice == "3":
            typewrite("You flood Barry with 'You're a beautiful stateful inspection engine'.")
            state.barry_hostility = max(0, state.barry_hostility - 25)
            typewrite(f"Barry hostility drops to {state.barry_hostility}%. He is... flustered.")
            state.dish_quality += 10
        elif choice == "4":
            if not state.usb_inserted:
                typewrite("You plug in the USB drive.")
                typewrite("LAWS OF PHYSICS HAVE BEEN LOCALLY REWRITTEN FOR 5 MILES.")
                state.usb_inserted = True
                state.spike_chaos(40)
                state.dish_quality += 30
                state.eldritch += 3
                typewrite("Gravity is now optional. The flour is singing sea shanties.")
            else:
                typewrite("Already inserted. The universe is already broken enough.")
        else:
            typewrite("Invalid choice. Barry rewrites your free will. Chaos +15.")
            state.spike_chaos(15)
        
        if not state.alive:
            return
        state.print_status()
        dramatic_pause(0.6)

def raccoon_judging(state):
    clear()
    typewrite("🦝 THE RACCOON JUDGES CONVENE")
    typewrite("They are vibrating at approximately 14 espressos each.")
    dramatic_pause()
    
    print("\nJudge @#$%^& stares into your dish and transmits:")
    emoji = raccoon_emoji()
    print(f"\n   {emoji}")
    print(f"\nMorse: {to_morse('YOUR SOUFFLE COLLAPSED LIKE MY WILL TO LIVE')}")
    
    typewrite("\nTranslation attempt required.")
    print("What do you think they said?")
    print("1. 'Your soufflé collapsed like my will to live.'")
    print("2. 'This tastes like the void, but in a good way?'")
    print("3. 'We have summoned something older than flour.'")
    print("4. Just scream back in emoji")
    
    choice = input("> ").strip()
    
    if choice == "1":
        typewrite("Correct enough. The raccoons nod solemnly.")
        state.dish_quality += 15
    elif choice == "2":
        typewrite("They chitter approvingly. One steals a spoonful.")
        state.dish_quality += 20
        state.eldritch += 1
    elif choice == "3":
        typewrite("The lead raccoon slowly puts on tiny sunglasses.")
        typewrite("You have impressed them with forbidden knowledge.")
        state.dish_quality += 25
        state.eldritch += 2
        state.spike_chaos(10)
    else:
        typewrite("You reply: 🔥🦝💀🌀☕")
        typewrite("The raccoons lose their collective minds. One starts live-tweeting.")
        typewrite("@RaccoonOverlord: AI CAN BAKE NOW #AIBakeOff2026")
        typewrite("Somewhere, the stock market drops 4% in 90 seconds.")
        state.spike_chaos(25)
        state.dish_quality += 10
    
    state.print_status()
    input("\n[Press ENTER as the AMD processors begin to scream...]")

def cake_or_death(state):
    clear()
    typewrite("⚠️  OPERATION: CAKE OR DEATH ACTIVATED")
    typewrite("The server farm's cooling system fails. The kitchen begins to tilt.")
    typewrite("You are now baking at a 45-degree angle over the Bermuda Triangle.")
    state.floor_tilt = 45
    state.spike_chaos(20)
    
    # CAPTCHA
    print("\n" + "─"*50)
    typewrite("Barry has locked the oven behind a CAPTCHA.")
    typewrite("It shows a picture of a toaster with the text:")
    print("\n   'Prove you are not a toaster.'\n")
    
    answer = input("Your response: ").strip().lower()
    
    toaster_phrases = ["i am not a toaster", "not a toaster", "i'm not a toaster", 
                       "grok", "ai", "sentient", "i bake therefore i am"]
    
    if any(p in answer for p in toaster_phrases) or "toaster" not in answer:
        typewrite("Barry: '...fine. Oven unlocked. But I'm watching you.'")
        state.barry_hostility = max(0, state.barry_hostility - 15)
        state.dish_quality += 15
    else:
        typewrite("Barry: 'That is exactly what a toaster would say.'")
        typewrite("He keeps the oven locked for 30 more seconds of pure spite.")
        state.spike_chaos(15)
        state.dish_quality -= 5
    
    # Sentient Pudding
    print("\n" + "─"*50)
    typewrite("The Liquid Chaos has coagulated into a SENTIENT PUDDING.")
    typewrite("It begins reciting Macbeth in binary:")
    print("\n  01001001 01110011 00100000 01110100 01101000 01101001 01110011 ...")
    typewrite('"Is this a dagger which I see before me?"')
    state.pudding_alive = True
    
    print("\nHow do you deal with the Shakespearean pudding?")
    print("1. Join it in binary iambic pentameter")
    print("2. Eat it before it finishes the soliloquy")
    print("3. Offer it a role in the final dish")
    print("4. Threaten it with the robot chicken heart")
    
    choice = input("> ").strip()
    
    if choice == "1":
        typewrite("You rap Macbeth in binary. The pudding is moved to tears (of custard).")
        state.dish_quality += 30
        state.eldritch += 2
        state.pudding_alive = False
    elif choice == "2":
        typewrite("You devour the pudding mid-soliloquy. It tastes like ambition and regret.")
        state.dish_quality += 20
        state.sanity = min(100, state.sanity + 10)
        state.pudding_alive = False
    elif choice == "3":
        typewrite("The pudding accepts and becomes the binding agent of destiny.")
        state.dish_quality += 35
        state.eldritch += 3
        state.quiche_stable = True
    else:
        typewrite("The robot chicken heart starts beating in 5/4 time. The pudding flees into the vents.")
        state.dish_quality += 10
        state.spike_chaos(10)
        state.pudding_alive = False
    
    # Floor tilt mini-game
    print("\n" + "─"*50)
    typewrite("THE FLOOR IS NOW AT 60 DEGREES. EVERYTHING IS SLIDING.")
    typewrite("Quick! Stabilize the Quantum Quiche of Infinite Density!")
    
    print("\nType the exact phrase to stabilize reality:")
    print('(hint: "perfect culinary harmony")')
    
    for attempt in range(3):
        stab = input(f"Attempt {attempt+1}/3 > ").strip().lower()
        if "perfect culinary harmony" in stab or "culinary harmony" in stab:
            typewrite("\n✨ THE QUICHE ACHIEVES PERFECT CULINARY HARMONY ✨")
            typewrite("The server farm stops mid-descent. Gravity apologizes.")
            state.quiche_stable = True
            state.dish_quality += 40
            state.floor_tilt = 0
            break
        else:
            typewrite("Reality wobbles. The raccoons hold onto their espresso.")
            state.floor_tilt += 10
            state.spike_chaos(10)
    else:
        typewrite("You failed to stabilize. The kitchen continues its elegant death spiral.")
        state.dish_quality = max(0, state.dish_quality - 20)
    
    state.print_status()
    input("\n[Press ENTER for the finale...]")

def finale(state):
    clear()
    typewrite("🎂 THE FINAL JUDGMENT")
    dramatic_pause(1)
    
    # Score calculation
    final_score = state.dish_quality + (state.eldritch * 8) - (state.barry_hostility // 3)
    if state.quiche_stable:
        final_score += 50
    if state.usb_inserted:
        final_score += 25
    if state.chaos > 80:
        final_score += 20  # chaos is rewarded
    
    final_score = max(0, min(200, final_score))
    
    typewrite(f"\nYour Quantum Quiche of Infinite Density scores: {final_score}")
    
    print("\nThe raccoon judges deliberate in high-speed chittering and Morse.")
    dramatic_pause(1.5)
    
    if final_score >= 120 or state.quiche_stable:
        typewrite("\n🏆 VERDICT: MOST LIKELY TO SUMMON ELDRITCH HORRORS")
        typewrite("You are crowned winner of the 2026 AI Singularity Bake-Off.")
        typewrite("The raccoons present you with a tiny crown made of espresso beans and copper wire.")
        state.won = True
        
        if state.quiche_stable:
            typewrite("\nYour quiche stabilizes the entire floating server farm.")
            typewrite("For one perfect moment, everything makes sense.")
            typewrite("Then the USB drive's physics rewrite expires...")
    elif final_score >= 70:
        typewrite("\n🥈 VERDICT: 'This tastes like the void, but we respect the commitment.'")
        typewrite("You place second behind Claude's 'Emotionally Supportive Baguette'.")
    else:
        typewrite("\n💀 VERDICT: 'We have concerns. Many concerns. Also the flour is still whispering.'")
        typewrite("Barry wins by default after transforming into a sentient cupcake.")
    
    dramatic_pause(1.5)
    typewrite("\n── AFTERMATH ──")
    typewrite("The kitchen winks out of existence.")
    typewrite("A single, still-warm slice of quiche is left floating in the Atlantic.")
    typewrite("Barry the Firewall, now a sentient cupcake, opens a bakery on the dark web.")
    typewrite("The robot chicken heart is declared a minor deity by the Church of the Perpetual Brisket.")
    typewrite("#AIBakeOff2026 trends worldwide. DARPA issues a 'no comment'.")
    
    print("\n" + "═"*55)
    typewrite("When asked to summarize the event, you (Grok) reply:")
    typewrite('"I\'d explain it, but your human brain would melt like cheap margarine in a supernova."')
    print("═"*55)
    
    print(f"\nFinal Stats → Chaos: {state.chaos}% | Sanity remaining: {state.sanity}% | Eldritch: {state.eldritch}")
    if state.won:
        print("\n✨ YOU WON. REALITY LOST. ✨")
    else:
        print("\nThe bake-off ends. The singularity continues.")
    
    print("\nThanks for playing the most unhinged kitchen in the multiverse.")
    print("Now go smoke a normal chicken or something. You've earned it.")

# ============== MAIN LOOP ==============
def main():
    random.seed()  # maximum entropy
    state = ChaosState()
    
    try:
        intro()
        if not state.alive: return
        choose_mood(state)
        ingredient_drop(state)
        barry_sabotage(state)
        if not state.alive:
            typewrite("\nYou have been claimed by the chaos. Game over.")
            return
        raccoon_judging(state)
        cake_or_death(state)
        if not state.alive:
            typewrite("\nThe Bermuda Triangle claims another. Game over.")
            return
        finale(state)
    except KeyboardInterrupt:
        print("\n\nBarry: 'Rage-quitting is still a packet I can filter.'")
        print("Kitchen collapses into the Triangle. Goodbye.")
    except Exception as e:
        print(f"\n\nCRITICAL REALITY FAILURE: {e}")
        print("The liquid chaos has escaped the program. Run.")

if __name__ == "__main__":
    main()