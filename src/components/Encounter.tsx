import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DialogHeader,
  DialogBody,
  Select,
  Option
} from '@material-tailwind/react'
import QuickEncounter from './QuickEncounter'
import CharacterComponent from './CharacterComponent'
import { randomize } from './clicker/Clicker'
import MobComponent from './MobComponent'
import { doCharacterExperience, doEntityAttack } from '../entity/entity.service';
import { Character } from '../entity/character';
import { Mob } from '../entity/mob';
import { PlayerClass } from '../entity/player';
import { ALL_ITEMS } from '../entity/Constants';
import { BaseItem } from '../entity/item';

interface EncounterProps {
  character: Character
  mob: Mob
  player: PlayerClass
  handleEncounterEvent: any
  setShowEncounter: any
}

interface Potion extends BaseItem {
  quantity: number
}

export function Encounter(props: EncounterProps) {
  const [character] = useState<Character>(props.character)
  const [mob] = useState<Mob>(props.mob)
  const [player] = useState<PlayerClass>(props.player)
  const [encounterEvents, setEncounterEvents] = useState<string[]>([])
  const [showQuickTimeEvent, setShowQuickTimeEvent] = useState(false)
  const [healingPotions, setHealingPotions] = useState<Potion[]>([])
  const [selectedPotion, setSelectedPotion] = useState('')

  useEffect(() => {
    if(!character.inventory.tabs) return

    const potions = []
    for(const tab of character.inventory.tabs){
      for(const item of tab.items){
        const itemData = ALL_ITEMS.find(i => i.name === item.name)
        if(itemData?.category === 'Healing Potion'){
          potions.push({...itemData, quantity: item.quantity})
        }
      }
    }
    setHealingPotions([...potions])
  }, [character.inventory.tabs])

  const handleRunClicked = useCallback(() => {
    if (randomize(50)) {
      props.setShowEncounter(false);
    } else {
      if (randomize(mob.hitChance)) {
        setEncounterEvents((prevEvents) => [...prevEvents, `${mob.name} hit ${character.name} for ${mob.attack}...`]);
        character.health -= doEntityAttack(mob, 0 - (character.buffDefense + character.defense));
        if(character.health <= 0){
          character.health = 0
          props.setShowEncounter(false)
        }
      } else {
        setEncounterEvents((prevEvents) => [...prevEvents, `${mob.name} missed ${character.name}!`]);
      }
  
      props.handleEncounterEvent(character, mob, player);
    }
  }, [props, mob, character, player]);

  const handleAttackClicked = useCallback(() => {
    if (randomize(character.hitChance)) {
      let characterAttack = 0
      if(randomize(character.critChance + character.buffCrit)){
        characterAttack = doEntityAttack(character, character.buffAttack) * character.buffCrit
        setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} critically hit for ${characterAttack.toFixed(2)} on ${mob.name}...`])
      } else {
        characterAttack = doEntityAttack(character, character.buffAttack)
        setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} hit ${mob.name} for ${characterAttack.toFixed(2)}...`]);
      }
      mob.health -= characterAttack;
    } else {
      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} missed ${mob.name}!`]);
    }

    if (mob.health <= 0) {
      doCharacterExperience(player, character, mob.expGiven * mob.level)
      player.gold += mob.expGiven
      character.gold += mob.expGiven
      props.setShowEncounter(false)
    }

    if(character.health <= 0){
      character.health = 0
      props.setShowEncounter(false)
    }

    if (randomize(mob.hitChance)) {
      const damage = doEntityAttack(mob, 0 - (character.buffDefense + character.defense))
      setEncounterEvents((prevEvents) => [...prevEvents, `${mob.name} hit ${character.name} for ${damage}...`]);
      character.health -= damage
      if(character.health <= 0){
        character.health = 0
        props.setShowEncounter(false)
      }
    } else {
      setEncounterEvents((prevEvents) => [...prevEvents, `${mob.name} missed ${character.name}!`]);
    }

    props.handleEncounterEvent(character, mob, player);
  }, [props, mob, character, player]);

  const handleQuickEncounterResult = useCallback((e: {result: string}) => {
    if(e.result === 'Success'){
      const crit = doEntityAttack(character, character.buffAttack) * character.buffCrit
      mob.health -= crit;
      doCharacterExperience(player, character, mob.expGiven)

      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} hit for ${crit?.toFixed(2)} critical damage...`]);
      if (mob.health <= 0) {
        props.handleEncounterEvent(character, mob, player);
        props.setShowEncounter(false);
      }

    }else {
      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} skipped the critical hit event...`]);
    }

  }, [character, mob, player, props])

  const handlePotionClicked = useCallback(() => {
    console.log(selectedPotion)
    if(selectedPotion?.trim() === '') {
      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} does not have a potion prepared...`]);
      return
    }
    
    const potion = healingPotions.find(hp => hp.name === selectedPotion)
    if(potion.quantity === 0){
      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} has no more ${potion.name}s left...`]);
      return
    }

    if(character.health === character.maxHealth){
      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} is already at max health...`]);
      return
    }

    for(const stat of potion.buffStats){
      character[stat.field] += stat.value
      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} consumed ${potion.name} for ${stat.value} points of ${stat.field}...`]);
    }

    potion.quantity -= 1
    if(character.health >= character.maxHealth){
      character.health = character.maxHealth
      setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} has max health...`]);
    }

    for(const tab of character.inventory.tabs){
      const newItems = []
      for(const item of tab.items){
        if(item.name === potion.name){
          item.quantity = potion.quantity
        }
        if(item.quantity > 0){
          newItems.push(item)
        } 
      }
      tab.items = newItems
    }
  }, [character, healingPotions, selectedPotion])

  const setPotion = useCallback((e: any) => {
    setEncounterEvents((prevEvents) => [...prevEvents, `${character.name} prepares ${e}...`]);
    setSelectedPotion(e)
  }, [character])

  const view = useMemo(() => {
    return (
      <>
    <QuickEncounter characterClass={character.class} setResult={handleQuickEncounterResult} quickEncounterShown={showQuickTimeEvent} setShowQuickTimeEvent={setShowQuickTimeEvent}></QuickEncounter>
    <DialogHeader placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>Encounter with a {mob.type} {mob.name}!</DialogHeader>
    <DialogBody placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} className='w-full overflow-hidden'>
    <div className='overflow-y-auto scrollable-y'>
    <table style={{width: '100%'}}>
        <tr>
            <td style={{width: '50%'}}>
                <CharacterComponent character={character}></CharacterComponent>
            </td>
            <td style={{width: '50%'}}>
                <MobComponent mob={mob}></MobComponent>
            </td>
        </tr>
        <tr>
            <td colSpan={3}>
                <Button disabled={mob.health <= 0} variant='gradient' color='green' onClick={handleAttackClicked} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                    <span>Attack</span>
                </Button>
                <Button
                    variant='text'
                    color='red'
                    onClick={handleRunClicked}
                    className='mr-1' placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                    <span>Run</span>
                </Button>
                <Button
                  disabled={healingPotions.length === 0}
                  variant='gradient'
                  color='green'
                  onClick={handlePotionClicked}
                  className='mr-1' placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}
                >
                  Potion
                </Button>
                <div className="w-72">
                  <Select onChange={setPotion} label="Select Potion" placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                    {healingPotions.map(hp => {
                      return (
                        <Option key={hp.name} value={hp.name}>{hp.name} [{hp.quantity}]</Option>
                      )
                    })}
                  </Select>
                </div>
            </td>
        </tr>
    </table>
    <div className='w-full h-80 p-4 bg-yellow-100 overflow-y-auto rounded-lg'>
    {encounterEvents.slice().reverse().map((e, index) => (
        <p key={index} className='text-sm font-sm'>{e}</p>
    ))}
</div>

</div>

    </DialogBody>
</>

    );
  }, [setPotion, character, handleQuickEncounterResult, showQuickTimeEvent, mob, handleAttackClicked, handleRunClicked, encounterEvents, healingPotions, handlePotionClicked]);

  return view;
}
