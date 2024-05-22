import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  DialogHeader,
  DialogBody,
} from '@material-tailwind/react'
import QuickEncounter from './QuickEncounter'
import CharacterComponent from './CharacterComponent'
import { randomize } from './clicker/Clicker'
import MobComponent from './MobComponent'
import { Character, Mob, Player } from '../entity/entity.interface';
import { doCharacterExperience, doEntityAttack } from '../entity/entity.service';

interface EncounterProps {
  character: Character
  mob: Mob
  player: Player
  handleEncounterEvent: any
  setShowEncounter: any
}

export function Encounter(props: EncounterProps) {
  const [character] = useState<Character>({ ...props.character })
  const [mob] = useState<Mob>({ ...props.mob })
  const [player] = useState<Player>({...props.player})
  const [encounterEvents, setEncounterEvents] = useState<string[]>([])
  const [showQuickTimeEvent, setShowQuickTimeEvent] = useState(false)

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

  const view = useMemo(() => {
    return (
      <>
    <QuickEncounter characterClass={character.class} setResult={handleQuickEncounterResult} quickEncounterShown={showQuickTimeEvent} setShowQuickTimeEvent={setShowQuickTimeEvent}></QuickEncounter>
    <DialogHeader placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>A wild {mob.name} attacks!</DialogHeader>
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
                <Button variant='gradient' color='green' onClick={handleAttackClicked} placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                    <span>Attack</span>
                </Button>
                <Button
                    variant='text'
                    color='red'
                    onClick={handleRunClicked}
                    className='mr-1' placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
                    <span>Run</span>
                </Button>
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
  }, [character, handleQuickEncounterResult, showQuickTimeEvent, mob, handleAttackClicked, handleRunClicked, encounterEvents]);

  return view;
}