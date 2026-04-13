import SkinData from "./SkinData.js";
import UnitManager from "./UnitManager.js";
import UpgradeViewer from "../components/UpgradeViewer.js";

class CalculatedManager {
  constructor(unitKey) {
    this.unitManager = new UnitManager(unitKey);
    this.unitManager.load();
    this.upgradeViewer = new UpgradeViewer();
  }

  calculated = {
    LaserDPS: {
      Default: {
        For: ["Accelerator"],
        Requires: ["Damage", "Cooldown"],
        Value: (level) => level.Damage / level.Cooldown,
      },
    },
    TowerDPS: {
      Default: {
        For: ["Engineer"],
        Requires: ["Damage", "Cooldown"],
        Value: (level) => level.Damage / level.Cooldown,
      },
      Crook: {
        For: ["Crook Boss"],
        Requires: [
          "Damage",
          "Cooldown",
          "PistolCrookSpawnTime",
          "TommyCrookSpawnTime",
          "BackupCallTime",
        ],
        Value: (level) => {
          const pistolDelayPerMinute =
            level.PistolCrookSpawnTime > 0
              ? level.BackupCallTime * (60 / level.PistolCrookSpawnTime)
              : 0;
          const tommyDelayPerMinute =
            level.TommyCrookSpawnTime > 0
              ? level.BackupCallTime * (60 / level.TommyCrookSpawnTime)
              : 0;

          const dpm =
            (level.Damage * (60 - pistolDelayPerMinute - tommyDelayPerMinute)) /
            level.Cooldown;

          return dpm / 60;
        },
      },
    },
    RamDPS: {
      Default: {
        Exclude: ["Engineer"],
        Requires: ["UnitToSend", "Spawnrate"],
        Value: (level) => {
          this.unitManager.load();

          if (!this.unitManager.hasUnit(level.UnitToSend)) return 0;
          const unit = this.unitManager.unitData[level.UnitToSend];

          return unit.attributes.Health / level.Spawnrate;
        },
      },
    },
    UnitDPS: {
      Default: {
        Requires: ["UnitToSend"],
        Value: (level) => {
          this.unitManager.load();

          const unitName = level.UnitToSend;
          if (!this.unitManager.hasUnit(unitName)) return 0;

          const unitData = this.unitManager.unitData[unitName];

          return unitData.attributes.DPS;
        },
      },
      Engineer: {
        For: ["Engineer"],
        Requires: ["UnitToSend", "MaxUnits"],
        Value: (level) => {
          this.unitManager.load();
          if (!this.unitManager.hasUnit(level.UnitToSend)) return 0;

          const unit = this.unitManager.unitData[level.UnitToSend];

          return unit.attributes.TotalDPS * level.MaxUnits;
        },
      },
    },
    AggregateUnitDPS: {
      Default: {
        Requires: ["UnitDPS", "Spawnrate"],
        Value: (level) => {
          let damage = 0;
          let remainingTime = 60;

          if (level.Spawnrate <= 0.1) {
            return Infinity;
          }

          while (remainingTime > 0) {
            damage += level.UnitDPS * remainingTime;

            remainingTime -= level.Spawnrate;
          }

          return damage / 60;
        },
      },
      Crook: {
        For: ["Crook Boss"],
        Requires: [
          "PistolCrookSpawnTime",
          "TommyCrookSpawnTime",
          "DoublePistolCrooks",
          "TommyDrum",
        ],
        Value: (level) => {
          const skin = level.levels.skinData.name;
          this.unitManager.load();

          const goldText = skin == "Golden" ? "Golden" : "";
          const goon1 = this.unitManager.unitData[`${goldText} Pistol Goon`];
          const goon2 = this.unitManager.unitData[`${goldText} Tommy Goon 1`];
          const goon3 = this.unitManager.unitData[`${goldText} Tommy Goon 2`];

          let goon1DPS = level.PistolCrookSpawnTime && goon1.attributes.DPS;
          if (level.DoublePistolCrooks) goon1DPS *= 2;

          let goon2DPS = level.TommyCrookSpawnTime && goon2.attributes.DPS;
          if (level.TommyDrum) goon2DPS = goon3.attributes.DPS;

          let damage = 0;
          let remainingTime = 60;

          if (level.PistolCrookSpawnTime > 0.1) {
            while (remainingTime > 0) {
              damage += goon1DPS * remainingTime;

              remainingTime -= level.PistolCrookSpawnTime;
            }
          }

          remainingTime = 60;

          if (level.TommyCrookSpawnTime > 0.1) {
            while (remainingTime > 0) {
              damage += goon2DPS * remainingTime;

              remainingTime -= level.TommyCrookSpawnTime;
            }
          }

          return damage / 60;
        },
      },
    },
    SpikeMaxDamage: {
      Default: {
        For: ["Trapper"],
        Value: (level) => {
          this.unitManager.load();

          // map tower level to spike level
          const spikeLevel = Math.min(level.Level, 4);
          const spikeName = `Spike ${spikeLevel}`;

          if (!this.unitManager.hasUnit(spikeName)) {
            return 0;
          }

          const spikeUnit = this.unitManager.unitData[spikeName];
          const damage = spikeUnit.attributes.Damage || 0;

          const result = damage * level.MaxTraps;
          return result;
        },
      },
    },
    LandmineMaxDamage: {
      Default: {
        For: ["Trapper"],
        Value: (level) => {
          this.unitManager.load();

          // landmine only available at levels 2+
          if (level.Level < 2) {
            return NaN;
          }

          const landmineLevel = Math.min(level.Level, 4);
          const landmineName = `Landmine ${landmineLevel}`;

          if (!this.unitManager.hasUnit(landmineName)) {
            return 0;
          }

          const landmineUnit = this.unitManager.unitData[landmineName];
          const damage = landmineUnit.attributes.Damage || 0;

          const result = damage * level.MaxTraps;
          return result;
        },
      },
    },
    BearTrapMaxDamage: {
      Default: {
        For: ["Trapper"],
        Value: (level) => {
          this.unitManager.load();

          // beartrap only available at levels 4+
          if (level.Level < 4) {
            return NaN;
          }

          const beartrapLevel = Math.min(level.Level, 4);
          const beartrapName = `Bear Trap ${beartrapLevel}`;

          if (!this.unitManager.hasUnit(beartrapName)) {
            return 0;
          }

          const beartrapUnit = this.unitManager.unitData[beartrapName];
          const damage = beartrapUnit.attributes.Damage || 0;

          const result = damage * level.MaxTraps;
          return result;
        },
      },
    },
    AmmoDischargeTime: {
      Default: {
        For: ["Accelerator"],
        Requires: ["MaxAmmo", "LaserDPS"],
        Value: (level) => level.MaxAmmo / level.LaserDPS,
      },
    },
    FireTime: {
      Default: {
        For: ["Gatling Gun"],
        Requires: ["Ammo", "Cooldown"],
        Value: (level) => level.Ammo * level.Cooldown,
      },
    },

    MaxDPS: {
      Default: {
        For: ["Paintballer"],
        Requires: ["DPS", "MaxHits"],
        Value: (level) => level.DPS * level.MaxHits,
      },

      Executioner: {
        For: ["Executioner"],
        Requires: ["DPS", "MaxHits", "MaxBounce"],
        Value: (level) => level.DPS * level.MaxHits * level.MaxBounce,
      },

      Swarmer: {
        For: ["Swarmer"],
        Requires: ["Damage", "Cooldown", "BeeDamage", "TickRate", "MaxStacks"],
        Value: (level) =>
          level.Damage / level.Cooldown +
          (level.BeeDamage / level.TickRate) * level.MaxStacks,
      },

      Trapper: {
        For: ["Trapper"],
        Value: (level) => {
          this.unitManager.load();

          let beartrapDPS = 0;
          let landmineDPS = 0;
          let spikeDPS = 0;

          if (level.Level >= 4) {
            const beartrapName = `Bear Trap ${Math.min(level.Level, 4)}`;
            if (this.unitManager.hasUnit(beartrapName)) {
              beartrapDPS =
                this.unitManager.unitData[beartrapName].attributes.DPS || 0;
            }
          }

          if (level.Level >= 2) {
            const landmineName = `Landmine ${Math.min(level.Level, 4)}`;
            if (this.unitManager.hasUnit(landmineName)) {
              landmineDPS =
                this.unitManager.unitData[landmineName].attributes.DPS || 0;
            }
          }

          const spikeName = `Spike ${Math.min(level.Level, 4)}`;
          if (this.unitManager.hasUnit(spikeName)) {
            spikeDPS = this.unitManager.unitData[spikeName].attributes.DPS || 0;
          }

          return Math.max(spikeDPS, landmineDPS, beartrapDPS);
        },
      },

      WarlockMelee: {
        For: ["Warlock"],
        Value: (level) =>
          (level.Damage + level["AOE Damage"] * level.MaxHits) / level.Cooldown,
        Subtype: (skinData) => skinData.name.includes("Melee"),
      },
    },

    "DPS Rate": {
      Default: {
        Requires: ["BeeDamage", "TickRate", "Cooldown"],
        Value: (level) =>
          (level.BeeDamage / level.TickRate) * (1 / level.Cooldown),
      },
    },

    TotalElapsedDamage: {
      Default: {
        Requires: ["BurnDamage", "BurnTime", "TickRate"],
        Value: (level) => (level.BurnDamage * level.BurnTime) / level.TickRate,
      },
      Cryomancer: {
        For: ["Cryomancer"],
        Requires: ["DebuffDamage", "SlowdownTime", "TickRate"],
        Value: (level) =>
          (level.DebuffDamage * level.SlowdownTime) / level.TickRate,
      },
      Swarmer: {
        For: ["Swarmer"],
        Requires: ["BeeDuration", "BeeDamage", "TickRate"],
        Value: (level) =>
          level.BeeDamage * Math.floor(level.BeeDuration / level.TickRate),
      },
      ToxicGunner: {
        For: ["Toxic Gunner"],
        Requires: ["PoisonDamage", "SlowdownTime", "TickRate"],
        Value: (level) =>
          (level.PoisonDamage * level.SlowdownTime) / level.TickRate,
      },
    },
    DPS: {
      Default: {
        Requires: ["Damage", "Cooldown"],
        Exclude: [
          "Farm",
          "DJ Booth",
          "Elf Camp",
          "Military Base",
          "Mecha Base",
          "Firework Technician",
          "Commander",
          "Trapper",
          "Mercenary Base",
          "Biologist",
          "Medic",
          "Archer",
        ],
        Value: (level) => {
          const DPS = level.Damage / level.Cooldown;
          return DPS === 0 ? NaN : DPS;
        },
      },
      Ranger: {
        For: ["Ranger"],
        Value: (level) =>
          (level.Damage + level.ExplosionDamage * level.MaxHits) /
          level.Cooldown,
      },
      Cowboy: {
        For: ["Cowboy"],
        Value: (level) =>
          (level.Damage * level.MaxAmmo) /
          (level.SpinDuration + level.Cooldown * (level.MaxAmmo - 1)),
      },
      Rocketeer: {
        For: ["Rocketeer"],
        Requires: ["Damage", "Cooldown", "MissileAmount"],
        Value: (level) =>
          level.MissileAmount > 0
            ? (level.Damage * level.MissileAmount) / level.Cooldown
            : level.Damage / level.Cooldown,
      },
      ElementalistFire: {
        For: ["Elementalist"],
        Value: (level) =>
          (level.Damage * level.Burst) /
            ((level.Burst - 1) * level.Cooldown + level.BurstCooldown) +
          level.BurnDamage / level.TickRate,
        Subtype: (skinData) =>
          skinData.name.includes("Fire") || !skinData.name.includes("Frost"),
      },
      ElementalistFrost: {
        For: ["Elementalist"],
        Value: (level) =>
          (level.Damage * level.Burst) /
          ((level.Burst - 1) * level.Cooldown + level.BurstCooldown),
        Subtype: (skinData) => skinData.name.includes("Frost"),
      },
      WarlockMelee: {
        For: ["Warlock"],
        Value: (level) => (level.Damage + level["AOE Damage"]) / level.Cooldown,
        Subtype: (skinData) => skinData.name.includes("Melee"),
      },
      Ace: {
        For: ["Ace Pilot"],
        Value: (level) => {
          const dps = level.Damage / level.Cooldown;
          const bombDps = level.BombDropping
            ? level.ExplosionDamage / level.BombTime
            : 0;

          return dps + bombDps;
        },
      },
      Accel: {
        For: ["Accelerator"],
        Requires: ["MaxAmmo", "ChargeTime", "LaserCooldown", "LaserTime"],
        Value: (level) => {
          const totalDamage = (level.MaxAmmo / level.Damage) * level.Cooldown;
          const totalCharge = level.ChargeTime + level.LaserCooldown;
          return level.MaxAmmo / (totalCharge + totalDamage);
        },
      },
      Brawler: {
        For: ["Brawler"],
        Value: (level) => {
          if (level.ComboLength == 1) {
            return level.Damage / level.Cooldown;
          }

          const totalNormalHits = level.ComboLength - 1;
          const totalDamage =
            totalNormalHits * level.Damage + level.FinalHitDamage;

          const comboLength =
            totalNormalHits * level.Cooldown + level.ComboCooldown;

          return totalDamage / comboLength;
        },
      },
      Commando: {
        For: ["Commando"],
        Value: (level) =>
          (level.Damage * level.Ammo) /
          (level.Ammo * level.Cooldown + level.ReloadTime),
      },
      CommandoLegacy: {
        For: ["Commando Pre-V1.74.0"],
        Value: (level) =>
          (level.Damage * level.Ammo) /
          (level.Ammo * level.Cooldown +
            (level.Ammo / level.Burst - 1) * level.BurstCooldown +
            level.ReloadTime),
      },
      Assassin: {
        For: ["Assassin"],
        Value: (level) => {
          // Level 1
          if (isNaN(level.WhirlwindDamage)) {
            return level.Damage / level.Cooldown;
          }

          // Level 4
          if (
            !isNaN(level.DamageThreshold) &&
            !isNaN(level.KnifeDamage) &&
            !isNaN(level.KnifeTime)
          ) {
            return (
              level.DamageThreshold /
              ((level.DamageThreshold /
                ((level.Damage * (level.WhirlwindHit - 1) +
                  level.WhirlwindDamage) /
                  level.WhirlwindHit)) *
                level.Cooldown +
                level.KnifeTime)
            );
          }

          // Level 2-3
          return (
            (level.Damage * 2 + level.WhirlwindDamage) /
            (level.Cooldown * level.WhirlwindHit)
          );
        },
      },

      BurnTower: {
        For: ["Pyromancer"],
        Requires: ["Damage", "Cooldown", "BurnDamage", "TickRate"],
        Value: (level) =>
          level.Damage / level.Cooldown + level.BurnDamage / level.TickRate,
      },

      AmmoTower: {
        For: ["Gatling Gun"],
        Requires: [
          "Damage",
          "Cooldown",
          "FireTime",
          "ReloadTime",
          "WindUpTime",
        ],
        Value: (level) => {
          const totalDamage = (level.Damage / level.Cooldown) * level.FireTime;
          const totalTime =
            level.FireTime + level.ReloadTime + level.WindUpTime;

          return totalDamage / totalTime;
        },
      },
      //            MultiHit: {
      //                For: ['Electroshocker'],
      //                Requires: ['Damage', 'Cooldown', 'MaxHits'],
      //                Value: (level) => {
      //                    const dps = level.Damage / level.Cooldown;

      //                    return dps * level.MaxHits;
      //                },
      //            },
      Missiles: {
        For: ["Pursuit"],
        Requires: ["Damage", "Cooldown", "Ammo", "ReloadTime", "RevTime"],
        Value: (level) =>
          (level.Damage * level.Ammo) /
          (level.ReloadTime + level.RevTime + level.Cooldown * level.Ammo),
      },

      Swarmer: {
        For: ["Swarmer"],
        Requires: ["Damage", "Cooldown", "BeeDamage", "TickRate"],
        Value: (level) =>
          level.Damage / level.Cooldown + level.BeeDamage / level.TickRate,
      },

      Burst: {
        For: ["Freezer"],
        Requires: ["Damage", "Cooldown", "Burst", "BurstCooldown"],
        Value: (level) =>
          (level.Damage * level.Burst) /
          (level.BurstCooldown + level.Cooldown * level.Burst),
      },
      Cryomancer: {
        For: ["Cryomancer"],
        Value: (level) => {
          const magDamage = level.Damage * level.MaxAmmo;
          const magTime = level.Cooldown * level.MaxAmmo + level.ReloadTime;

          const gunDPS = magDamage / magTime;
          const dotDPS = level.DebuffDamage / level.TickRate;

          return gunDPS + dotDPS;
        },
      },
      SoldierBurst: {
        For: ["Soldier"],
        Value: (level) => {
          const totalDamage = level.Damage * level.Burst;
          const totalTime = level.Cooldown * level.Burst + level.BurstCooldown;

          return totalDamage / totalTime;
        },
      },
      ToxicGunner: {
        For: ["Toxic Gunner"],
        Value: (level) => {
          if (level.Burst === 0) {
            return level.Damage / level.Cooldown;
          }

          const totalDamage = level.Damage * level.Burst;
          const totalReload = level.ReloadTime + level.Cooldown * level.Burst;

          return totalDamage / totalReload;
        },
      },
      Shotgun: {
        For: ["Shotgunner"],
        Value: (level) => {
          const dps = level.Damage / level.Cooldown;
          return dps * level.ShotSize;
        },
      },
      Spawner: {
        For: ["Engineer", "Military Base"],
        Value: (level) => {
          const unitDPS = level.UnitDPS ?? 0;
          const towerDPS = level.TowerDPS ?? 0;
          const ramDPS = level.RamDPS ?? 0;

          return unitDPS + towerDPS + ramDPS;
        },
      },
      HallowPunk: {
        For: ["Hallow Punk"],
        Value: (level) => {
          const dps = level.Damage / level.Cooldown;
          const burnDPS =
            level.BurnDamage && level.TickRate
              ? level.BurnDamage / level.TickRate
              : 0;
          return dps + burnDPS;
        },
      },
      CriticalMelee: {
        For: ["Warden", "Slasher"],
        Value: (level) =>
          (level.Damage * 2 + level.CriticalDamage) /
          level.CriticalSwing /
          level.Cooldown,
      },
    },

    CriticalDamage: {
      Default: {
        Requires: ["Damage", "CriticalMultiplier"],
        Value: (level) => {
          if (level.CriticalMultiplier === 0) {
            return NaN;
          }
          return Math.ceil(level.Damage * (level.CriticalMultiplier / 100));
        },
      },
    },

    AftershockDamage: {
      Default: {
        Requires: ["Damage", "AftershockMultiplier"],
        Value: (level) => {
          if (level.AftershockMultiplier === 0) {
            return NaN;
          }
          return Math.ceil(level.Damage * (level.AftershockMultiplier / 100));
        },
      },
    },

    AftershockDPS: {
      Default: {
        Requires: ["AftershockDamage"],
        Value: (level) => level.AftershockDamage / level.Cooldown,
      },
    },

    ClusterDPS: {
      Default: {
        For: ["Mortar"],
        Value: (level) => {
          if (level.ClusterDamage === 0 || level.ClusterCount === 0) {
            return NaN;
          }
          return (level.ClusterDamage * level.ClusterCount) / level.Cooldown;
        },
      },
    },

    CallToArmsDPS: {
      Default: {
        For: ["Commander"],
        Value: (level) => {
          const abilitycd = this.upgradeViewer.getAbilityCooldownValue(0);
          return (
            ((level.Damage / level.Cooldown) * level.AttackTime) / abilitycd
          );
        },
      },
    },
    CaravanDPS: {
      Default: {
        For: ["Commander"],
        Value: (level) => {
          const abilitylvl = this.upgradeViewer.getAbilityLevelValue(1);
          if (level.Level < abilitylvl) {
            return NaN;
          }
          const abilitycd = this.upgradeViewer.getAbilityCooldownValue(1);
          return (
            ((level.Damage / level.Cooldown) * level.AttackTime) / abilitycd
          );
        },
      },
    },

    LimitDPS: {
      Default: {
        Requires: ["DPS", "Limit"],

        Value: (level) => level.DPS * level.Limit,
      },
    },

    NetCost: {
      Default: {
        Value: (level) =>
          level.levels.levels.reduce(
            (total, nextLevel) =>
              nextLevel.Level > level.Level ? total : total + nextLevel.Cost,
            0,
          ),
      },
    },
    LimitNetCost: {
      Default: {
        Requires: ["NetCost", "Limit"],
        Value: (level) => level.NetCost * level.Limit,
      },
    },
    CostEfficiency: {
      Default: {
        Requires: ["NetCost", "DPS"],
        Exclude: ["Mercenary Base", "Biologist"],
        Value: (level) => {
          const efficiency = level.NetCost / level.DPS;
          return isFinite(efficiency) ? efficiency : NaN;
        },
      },
      Commander: {
        For: ["Commander"],
        Value: (level) => {
          const efficiency = level.NetCost / level.CallToArmsDPS;
          return isFinite(efficiency) ? efficiency : NaN;
        },
      },
      Mortar: {
        For: ["Mortar"],
        Value: (level) => {
          const clusterDPS = isNaN(level.ClusterDPS) ? 0 : level.ClusterDPS;
          const efficiency = level.NetCost / (level.DPS + clusterDPS);
          return isFinite(efficiency) ? efficiency : NaN;
        },
      },

      TotalDPS: {
        For: ["Commando", "Sledger", "War Machine", "Toxic Gunner", "Assassin"],
        Value: (level) => level.NetCost / level.TotalDPS,
      },
    },
    Coverage: {
      Default: {
        Requires: ["Range"],
        Value: (level) => {
          let x = level.Range;
          const a = -0.00229008361916565;
          const b = 0.165383660474954;
          const c = 0.234910819904625;
          const d = 2.62040766713282;

          if (x > 45) {
            x = 45;
          }

          return a * x ** 3 + b * x ** 2 + c * x + d;
        },
      },
    },
    MaxCostEfficiency: {
      Default: {
        Requires: ["MaxDPS", "NetCost"],
        Value: (level) => level.NetCost / level.MaxDPS,
      },
    },
    BossPotential: {
      Default: {
        Requires: ["Coverage", "DPS"],
        Value: (level) => level.Coverage * level.DPS,
      },
    },
    LimitBossPotential: {
      Default: {
        Requires: ["BossPotential", "Limit"],
        Value: (level) => level.BossPotential * level.Limit,
      },
    },
    BossValue: {
      Default: {
        Requires: ["BossPotential", "NetCost"],
        Value: (level) => (60 * level.BossPotential) / level.NetCost,
      },
    },
    Value: {
      Default: {
        Requires: ["NetCost", "DPS", "Range"],
        Value: (level) =>
          (1000 * level.DPS * level.Range ** 0.4) / level.NetCost,
      },
    },
    IncomeEfficiency: {
      Default: {
        Requires: ["NetCost", "DPS"],
        For: ["Cowboy"],
        Value: (level) =>
          (level.Income + level.MaxAmmo * level.Damage) /
          (level.MaxAmmo * level.Damage),
      },
    },
    IncomePerSecond: {
      Default: {
        Requires: ["Income", "MaxAmmo", "SpinDuration"],
        For: ["Cowboy"],
        Value: (level) =>
          level.Income /
          (level.SpinDuration + level.Cooldown * (level.MaxAmmo - 1)),
      },
    },
    TotalIncomePerSecond: {
      Default: {
        Requires: ["IncomePerSecond", "DPS"],
        For: ["Cowboy"],
        Value: (level) => level.IncomePerSecond + level.DPS,
      },
    },
    WavesUntilNetProfit: {
      Default: {
        Requires: ["Income", "NetCost"],
        For: ["Farm"],
        Value: (level) => level.NetCost / level.Income,
      },
    },
    WavesUntilUpgradeProfit: {
      Default: {
        Requires: ["Income", "NetCost"],
        For: ["Farm"],
        Value: (level) => {
          const lastLevelIncome =
            level.Level === 0 ? 0 : level.levels.levels[level.Level - 1].Income;
          return level.Cost / (level.Income - lastLevelIncome);
        },
      },
    },

    PoisonDPS: {
      Default: {
        For: ["Toxic Gunner"],
        Value: (level) => {
          return level.PoisonDamage / level.TickRate;
        },
      },
    },

    MissileDPS: {
      Default: {
        For: ["War Machine"],
        Value: (level) =>
          (level.ExplosionDamage * level.MissileAmount) / level.ReloadTime,
      },
      MechaBase: {
        For: ["Mecha Base"],
        Value: (level) => {
          this.unitManager.load();

          const unitName = level.UnitToSend;
          if (!this.unitManager.hasUnit(unitName)) return 0;

          const unitData = this.unitManager.unitData[unitName];

          return unitData.attributes.MissileDPS;
        },
      },
      Pursuit: {
        For: ["Pursuit"],
        Requires: [
          "ExplosionDamage",
          "MissileCooldown",
          "MissileAmount",
          "TimeBetweenMissiles",
        ],
        Value: (level) =>
          (level.ExplosionDamage * level.MissileAmount) /
          (level.MissileCooldown +
            level.TimeBetweenMissiles * level.MissileAmount),
      },
    },

    BurnDPS: {
      Default: {
        For: ["Archer"],
        Value: (level) => {
          this.unitManager.load();

          let arrowName;
          if (level.Level >= 5) {
            arrowName = "Flame Arrow 5";
          } else if (level.Level >= 4) {
            arrowName = "Flame Arrow 4";
          } else if (level.Level >= 3) {
            arrowName = "Flame Arrow 3";
          } else {
            return 0;
          }

          if (!this.unitManager.hasUnit(arrowName)) return 0;

          const arrow = this.unitManager.unitData[arrowName];
          return arrow.attributes.BurnDamage / arrow.attributes.TickRate;
        },
      },
    },

    ExplosionDPS: {
      Default: {
        For: ["Archer"],
        Value: (level) => {
          this.unitManager.load();

          if (level.Level < 5) {
            return 0;
          }

          const arrowName = "Explosive Arrow 5";
          if (!this.unitManager.hasUnit(arrowName)) return 0;

          const arrow = this.unitManager.unitData[arrowName];
          if (!arrow || !arrow.attributes || !arrow.attributes.ExplosionDamage)
            return 0;

          return arrow.attributes.ExplosionDamage / level.Cooldown;
        },
      },
    },

    ArrowDPS: {
      Default: {
        For: ["Archer"],
        Value: (level) => {
          this.unitManager.load();

          let arrowName;
          if (level.Level <= 2) {
            arrowName = "Arrow 2";
          } else if (level.Level <= 1) {
            arrowName = "Arrow 1";
          } else if (level.Level <= 0) {
            arrowName = "Arrow 0";
          } else {
            return NaN;
          }

          if (!this.unitManager.hasUnit(arrowName)) return NaN;

          return level.Damage / level.Cooldown;
        },
      },
    },

    FlameArrowDPS: {
      Default: {
        For: ["Archer"],
        Value: (level) =>
          level.BurnDPS === 0
            ? NaN
            : level.Damage / level.Cooldown + level.BurnDPS,
      },
    },

    ShockArrowDPS: {
      Default: {
        For: ["Archer"],
        Value: (level) => {
          this.unitManager.load();

          let arrowName;
          if (level.Level >= 5) {
            arrowName = "Shock Arrow 5";
          } else if (level.Level >= 4) {
            arrowName = "Shock Arrow 4";
          } else {
            return NaN;
          }

          if (!this.unitManager.hasUnit(arrowName)) return NaN;

          return level.Damage / level.Cooldown;
        },
      },
    },

    ExplosiveArrowDPS: {
      Default: {
        For: ["Archer"],
        Value: (level) =>
          level.ExplosionDPS === 0
            ? NaN
            : level.Damage / level.Cooldown + level.ExplosionDPS,
      },
    },

    ArrowCE: {
      Default: {
        For: ["Archer"],
        Value: (level) => level.NetCost / level.ArrowDPS,
      },
    },

    FlameArrowCE: {
      Default: {
        For: ["Archer"],
        Value: (level) => level.NetCost / level.FlameArrowDPS,
      },
    },

    ShockArrowCE: {
      Default: {
        For: ["Archer"],
        Value: (level) => level.NetCost / level.ShockArrowDPS,
      },
    },

    ExplosiveArrowCE: {
      Default: {
        For: ["Archer"],
        Value: (level) => level.NetCost / level.ExplosiveArrowDPS,
      },
    },

    WhirlwindDamage: {
      Default: {
        For: ["Assassin"],
        Value: (level) =>
          Math.ceil(level.Damage * (level.WhirlwindMultiplier / 100)),
      },
    },
    KnifeDPS: {
      Default: {
        For: ["Assassin"],
        Value: (level) =>
          (level.KnifeDamage * level.KnifeAmount) /
          ((level.DamageThreshold /
            ((level.Damage * (level.WhirlwindHit - 1) + level.WhirlwindDamage) /
              level.WhirlwindHit)) *
            level.Cooldown +
            level.KnifeTime),
      },
    },

    "BleedDamageTick (100HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.BleedStack ** level.ExponentialValue *
          100 ** level.ExponentialValue,
      },
    },
    "BleedCollaspeDamage (100HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.MaxStacks ** level.ExponentialValue *
          100 ** level.ExponentialValue,
      },
    },
    "BleedDamageTick (10HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.BleedStack ** level.ExponentialValue *
          10 ** level.ExponentialValue,
      },
    },
    "BleedCollaspeDamage (10HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.MaxStacks ** level.ExponentialValue *
          10 ** level.ExponentialValue,
      },
    },
    "BleedDamageTick (1000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.BleedStack ** level.ExponentialValue *
          1000 ** level.ExponentialValue,
      },
    },
    "BleedCollaspeDamage (1000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.MaxStacks ** level.ExponentialValue *
          1000 ** level.ExponentialValue,
      },
    },
    "BleedDamageTick (10000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.BleedStack ** level.ExponentialValue *
          10000 ** level.ExponentialValue,
      },
    },
    "BleedCollaspeDamage (10000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.MaxStacks ** level.ExponentialValue *
          10000 ** level.ExponentialValue,
      },
    },
    "BleedDamageTick (100000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.BleedStack ** level.ExponentialValue *
          100000 ** level.ExponentialValue,
      },
    },
    "BleedCollaspeDamage (100000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.MaxStacks ** level.ExponentialValue *
          100000 ** level.ExponentialValue,
      },
    },
    "BleedDamageTick (1000000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.BleedStack ** level.ExponentialValue *
          1000000 ** level.ExponentialValue,
      },
    },
    "BleedCollaspeDamage (1000000HP)": {
      Default: {
        For: ["Slasher"],
        Value: (level) =>
          level.BleedDamage *
          level.MaxStacks ** level.ExponentialValue *
          1000000 ** level.ExponentialValue,
      },
    },
    NetPriceToIncomeRatio: {
      Default: {
        Requires: ["Income", "NetCost"],
        For: ["Farm"],
        Value: (level) => {
          const ratio = level.NetCost / level.Income;
          const roundedRatio = Math.round(ratio * 100) / 100;
          const formattedRatio = String(roundedRatio).replace(/\.?0+$/, "");
          return `${formattedRatio}:1`;
        },
      },
    },
    TotalDPS: {
      Default: {
        For: ["Commando"],
        Value: (level) => {
          this.unitManager.load();
          let missileDPS = 0;

          if (level.Level >= 4) {
            // level 4+ uses missile 2
            const missile2 = this.unitManager.unitData["Missile 2"];
            const missileNumber = parseInt("Missile 2".match(/\d+$/)[0]);
            const missileLevel = missileNumber - 1;
            const cooldown =
              this.upgradeViewer.getAbilityCooldownValue(missileLevel);

            if (
              missile2 &&
              missile2.attributes &&
              missile2.attributes.ExplosionDamage &&
              cooldown
            ) {
              missileDPS = missile2.attributes.ExplosionDamage / cooldown;
            }
          } else if (level.Level >= 3) {
            // level 3 uses missile 1
            const missile1 = this.unitManager.unitData["Missile 1"];
            const missileNumber = parseInt("Missile 1".match(/\d+$/)[0]);
            const missileLevel = missileNumber - 1;
            const cooldown =
              this.upgradeViewer.getAbilityCooldownValue(missileLevel);

            if (
              missile1 &&
              missile1.attributes &&
              missile1.attributes.ExplosionDamage &&
              cooldown
            ) {
              missileDPS = missile1.attributes.ExplosionDamage / cooldown;
            }
          }

          return level.DPS + missileDPS;
        },
      },

      Sledger: {
        For: ["Sledger"],
        Value: (level) => {
          let totalDPS = level.DPS;
          if (!isNaN(level.AftershockDPS)) {
            totalDPS += level.AftershockDPS;
          }
          return totalDPS;
        },
      },

      WarMachine: {
        For: ["War Machine", "Pursuit"],
        Value: (level) => {
          let totalDPS = level.DPS;
          if (!isNaN(level.MissileDPS)) {
            totalDPS += level.MissileDPS;
          }
          return totalDPS;
        },
      },

      MechaBase: {
        For: ["Mecha Base"],
        Value: (level) => {
          const unitDPS = level.UnitDPS;
          const missileDPS = isNaN(level.MissileDPS) ? 0 : level.MissileDPS;
          return unitDPS + missileDPS + level.RamDPS;
        },
      },

      ToxicGunner: {
        For: ["Toxic Gunner"],
        Value: (level) => level.DPS + level.PoisonDPS,
      },

      Assassin: {
        For: ["Assassin"],
        Value: (level) => level.DPS + level.KnifeDPS,
      },
    },

    // boosts
    Cooldown: {
      Type: "Override",

      Default: {
        Requires: ["Cooldown"],
        Value: (cooldown) => {
          const { extraCooldown, firerateBuff, RateOfFireBug } =
            window.state.boosts.tower;

          return (
            Math.round(
              (cooldown / (firerateBuff + 1) + extraCooldown + RateOfFireBug) *
                1000,
            ) / 1000
          );
        },
      },
    },
    Damage: {
      Type: "Override",

      Default: {
        Requires: ["Damage"],
        Value: (damage) => {
          const { damageBuff, flatDamage } = window.state.boosts.tower;
          return (damage + (flatDamage || 0)) * (damageBuff + 1);
        },
      },
    },
    ExplosionDamage: {
      Type: "Override",

      Default: {
        Requires: ["ExplosionDamage"],
        Value: (explosionDamage) => {
          const { damageBuff, flatDamage } = window.state.boosts.tower;
          return (explosionDamage + (flatDamage || 0)) * (damageBuff + 1);
        },
      },
    },
    Range: {
      Type: "Override",

      Default: {
        Requires: ["Range"],
        Value: (range) => {
          const { rangeBuff } = window.state.boosts.tower;

          return range * (rangeBuff + 1);
        },
      },
    },
    Cost: {
      Type: "Override",

      Default: {
        Requires: ["Cost"],
        Value: (cost, level) => {
          const { discount } = window.state.boosts.tower;

          return level.Level == 0 && discount > 0
            ? cost
            : cost * (-discount + 1);
        },
      },
    },
    SpawnTime: {
      Type: "Override",

      Default: {
        Requires: ["SpawnTime"],
        Value: (spawnTime) => {
          const { spawnrateBuff } = window.state.boosts.unit;

          return spawnTime / (spawnrateBuff + 1);
        },
      },
    },
  };

  // Update the getValue method to check for custom calculation system first
  getValue(calculatedField, skinData) {
    if (skinData.tower.calculationSystem) {
      for (let [_, value] of Object.entries(calculatedField)) {
        if (value?.For?.includes(skinData.tower.calculationSystem)) {
          return value;
        }
      }
    }

    // otherwise use the default behavior
    for (let [_, value] of Object.entries(calculatedField)) {
      if (value?.For?.includes(skinData.tower.name)) {
        // checks subtypes
        if (value.Subtype && value.Subtype(skinData)) {
          return value;
        } else if (!value.Subtype) {
          return value;
        }
      }
    }

    return calculatedField.Default;
  }

  /**
   *
   * @param {SkinData} skinData
   */
  validate(calculatedField, skinData) {
    let valid = true;

    if (calculatedField.Exclude) {
      // Check both tower name AND calculation system for exclusions
      valid &= !(
        calculatedField.Exclude.includes(skinData.tower.name) ||
        (skinData.tower.calculationSystem &&
          calculatedField.Exclude.includes(skinData.tower.calculationSystem))
      );
    }

    // VITE FIX: always validate requirements properly, regardless of calculation system
    if (calculatedField.Requires) {
      valid &= calculatedField.Requires.reduce((a, v) => {
        return a && skinData.levels.attributes.includes(v);
      }, true);
    }

    // criteria
    if (skinData.tower.calculationSystem) {
      if (calculatedField.For) {
        // If this is a custom calc system, check if it matches
        valid &= calculatedField.For.includes(skinData.tower.calculationSystem);
      }
    } else if (calculatedField.For) {
      // Otherwise use tower name
      valid &= calculatedField.For.includes(skinData.tower.name);
    }

    return valid;
  }

  /**
   * @param {SkinData} skinData
   */
  #add(name, skinData) {
    const dpsValue = this.getValue(this.calculated[name], skinData);

    // debugs
    if (name === "DPS" && skinData.tower.calculationSystem) {
      console.log(
        `Using ${skinData.tower.calculationSystem} calculation for ${skinData.tower.name}'s ${name}`,
      );
    }

    if (this.validate(dpsValue, skinData)) {
      // don't evaluate the function here, just pass the function reference
      // this lets the levels manager evaluate it later with the correct context
      skinData.levels.addCalculated(name, dpsValue.Value);
    }
  }

  addCalculate(skinData) {
    this.unitManager.load();

    // always added
    this.#add("Cooldown", skinData);
    this.#add("Damage", skinData);
    this.#add("Range", skinData);
    this.#add("Cost", skinData);

    if (skinData.levels.attributes.includes("ExplosionDamage")) {
      this.#add("ExplosionDamage", skinData);
    }

    if (skinData.levels.attributes.includes("SpawnTime")) {
      this.#add("SpawnTime", skinData);
    }

    this.#add("LaserDPS", skinData);
    this.#add("TotalElapsedDamage", skinData);
    this.#add("CriticalDamage", skinData);
    this.#add("AftershockDamage", skinData);
    this.#add("AftershockDPS", skinData);
    this.#add("WhirlwindDamage", skinData);
    this.#add("BleedDamageTick (10HP)", skinData);
    this.#add("BleedCollaspeDamage (10HP)", skinData);
    this.#add("BleedDamageTick (100HP)", skinData);
    this.#add("BleedCollaspeDamage (100HP)", skinData);
    this.#add("BleedDamageTick (1000HP)", skinData);
    this.#add("BleedCollaspeDamage (1000HP)", skinData);
    this.#add("BleedDamageTick (10000HP)", skinData);
    this.#add("BleedCollaspeDamage (10000HP)", skinData);
    this.#add("BleedDamageTick (100000HP)", skinData);
    this.#add("BleedCollaspeDamage (100000HP)", skinData);
    this.#add("BleedDamageTick (1000000HP)", skinData);
    this.#add("BleedCollaspeDamage (1000000HP)", skinData);
    this.#add("FireTime", skinData);
    this.#add("SpikeMaxDamage", skinData);
    this.#add("LandmineMaxDamage", skinData);
    this.#add("BearTrapMaxDamage", skinData);
    this.#add("TowerDPS", skinData);
    this.#add("UnitDPS", skinData);
    this.#add("AggregateUnitDPS", skinData);
    this.#add("RamDPS", skinData);
    this.#add("AmmoDischargeTime", skinData);
    this.#add("MissileDPS", skinData);
    this.#add("DPS", skinData);
    this.#add("BurnDPS", skinData);
    this.#add("PoisonDPS", skinData);
    this.#add("ExplosionDPS", skinData);
    this.#add("ArrowDPS", skinData);
    this.#add("FlameArrowDPS", skinData);
    this.#add("ShockArrowDPS", skinData);
    this.#add("ExplosiveArrowDPS", skinData);
    this.#add("KnifeDPS", skinData);
    this.#add("TotalDPS", skinData);
    this.#add("ClusterDPS", skinData);
    this.#add("CallToArmsDPS", skinData);
    this.#add("CaravanDPS", skinData);
    this.#add("DPS Rate", skinData);
    this.#add("LimitDPS", skinData);
    this.#add("MaxDPS", skinData);
    this.#add("NetCost", skinData);
    this.#add("LimitNetCost", skinData);
    this.#add("CostEfficiency", skinData);
    this.#add("MaxCostEfficiency", skinData);
    this.#add("ArrowCE", skinData);
    this.#add("FlameArrowCE", skinData);
    this.#add("ShockArrowCE", skinData);
    this.#add("ExplosiveArrowCE", skinData);
    this.#add("Coverage", skinData);
    this.#add("BossPotential", skinData);
    this.#add("LimitBossPotential", skinData);
    this.#add("BossValue", skinData);
    this.#add("Value", skinData);
    this.#add("IncomeEfficiency", skinData);
    this.#add("IncomePerSecond", skinData);
    this.#add("TotalIncomePerSecond", skinData);
    this.#add("WavesUntilNetProfit", skinData);
    this.#add("WavesUntilUpgradeProfit", skinData);
    this.#add("NetPriceToIncomeRatio", skinData);
  }
}

export default CalculatedManager;
