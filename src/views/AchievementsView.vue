<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAchievementStore } from '../store/achievement.store';
import { useAuthStore } from '../store/auth.store';
import { type Achievement } from '../types/models';

const achievementStore = useAchievementStore();
const authStore = useAuthStore();

// Loading state
const loading = ref(false);

// Selected achievement for detail view
const selectedAchievement = ref<Achievement | null>(null);
const showDetailDialog = ref(false);

// Computed properties
const userXp = computed(() => authStore.user?.xp || 0);

const unlockedAchievements = computed(() => {
  return achievementStore.getUnlockedAchievements(userXp.value);
});

const lockedAchievements = computed(() => {
  const unlocked = unlockedAchievements.value.map(a => a.id);
  return achievementStore.getAchievements.filter(a => !unlocked.includes(a.id));
});

// Methods
const fetchAchievements = async () => {
  loading.value = true;
  try {
    await achievementStore.fetchAllAchievements();
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
  } finally {
    loading.value = false;
  }
};

const calculateProgress = (achievement: Achievement) => {
  if (userXp.value >= achievement.xpRequired) {
    return 100;
  }
  return Math.floor((userXp.value / achievement.xpRequired) * 100);
};

const showAchievementDetails = (achievement: Achievement) => {
  selectedAchievement.value = achievement;
  showDetailDialog.value = true;
};

// Lifecycle hooks
onMounted(fetchAchievements);
</script>

<template>
  <div>
    <h1 class="text-h4 mb-4">Achievements</h1>

    <!-- User XP -->
    <v-card class="mb-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon size="large" color="amber" class="mr-2">mdi-star</v-icon>
          <div>
            <div class="text-h6">Your XP: {{ userXp }}</div>
            <div class="text-subtitle-2">Complete tasks to earn more XP and unlock achievements!</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Unlocked Achievements -->
    <h2 class="text-h5 mb-2">Unlocked Achievements</h2>
    <v-card class="mb-4">
      <v-card-text>
        <v-list v-if="unlockedAchievements.length > 0">
          <v-list-item
            v-for="achievement in unlockedAchievements"
            :key="achievement.id"
            @click="showAchievementDetails(achievement)"
            class="achievement-item"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" class="mr-3">
                <v-icon color="white">mdi-trophy</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="text-h6">
              {{ achievement.name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ achievement.description }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-chip color="success">
                {{ achievement.xpRequired }} XP
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <v-alert
          v-else
          type="info"
          text="You haven't unlocked any achievements yet. Complete tasks to earn XP and unlock achievements!"
        ></v-alert>
      </v-card-text>
    </v-card>

    <!-- Locked Achievements -->
    <h2 class="text-h5 mb-2">Locked Achievements</h2>
    <v-card>
      <v-card-text>
        <v-list v-if="lockedAchievements.length > 0">
          <v-list-item
            v-for="achievement in lockedAchievements"
            :key="achievement.id"
            @click="showAchievementDetails(achievement)"
            class="achievement-item"
          >
            <template v-slot:prepend>
              <v-avatar color="grey" class="mr-3">
                <v-icon color="white">mdi-lock</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="text-h6">
              {{ achievement.name }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ achievement.description }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="text-right">
                <v-chip color="primary" class="mb-1">
                  {{ achievement.xpRequired }} XP
                </v-chip>
                <v-progress-linear
                  :model-value="calculateProgress(achievement)"
                  color="primary"
                  height="10"
                  striped
                >
                  <template v-slot:default="{ value }">
                    <span class="progress-text">{{ Math.ceil(value) }}%</span>
                  </template>
                </v-progress-linear>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <v-alert
          v-else
          type="success"
          text="Congratulations! You've unlocked all available achievements!"
        ></v-alert>
      </v-card-text>
    </v-card>
  </div>

  <!-- Achievement Detail Dialog -->
  <v-dialog v-model="showDetailDialog" max-width="500">
    <v-card v-if="selectedAchievement">
      <v-card-title class="text-h5">
        {{ selectedAchievement.name }}
        <v-chip 
          :color="userXp >= selectedAchievement.xpRequired ? 'success' : 'primary'"
          class="ml-2"
        >
          {{ selectedAchievement.xpRequired }} XP
        </v-chip>
      </v-card-title>

      <v-card-text>
        <v-avatar 
          :color="userXp >= selectedAchievement.xpRequired ? 'primary' : 'grey'" 
          size="64" 
          class="mb-4"
        >
          <v-icon color="white" size="large">
            {{ userXp >= selectedAchievement.xpRequired ? 'mdi-trophy' : 'mdi-lock' }}
          </v-icon>
        </v-avatar>

        <div class="text-body-1 mb-4">
          {{ selectedAchievement.description }}
        </div>

        <div v-if="userXp < selectedAchievement.xpRequired">
          <div class="text-subtitle-1 mb-2">Your progress:</div>
          <v-progress-linear
            :model-value="calculateProgress(selectedAchievement)"
            color="primary"
            height="20"
            striped
          >
            <template v-slot:default="{ value }">
              <span>{{ Math.ceil(value) }}%</span>
            </template>
          </v-progress-linear>
          <div class="text-caption mt-2">
            You need {{ selectedAchievement.xpRequired - userXp }} more XP to unlock this achievement
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="showDetailDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.progress-text {
  font-size: 10px;
  font-weight: bold;
}

.achievement-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.achievement-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
