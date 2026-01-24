export type BootstrapProfile = {
  name?: string;
  zodiac?: string;
};

let bootstrapProfile: BootstrapProfile | null = null;

export const setBootstrapProfile = (profile: BootstrapProfile) => {
  bootstrapProfile = profile;
};

export const getBootstrapProfile = (): BootstrapProfile | null => bootstrapProfile;

export const clearBootstrapProfile = () => {
  bootstrapProfile = null;
};
