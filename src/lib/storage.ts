export interface StudioImage {
  name: string;
  url: string;
  id: string;
}

/** Public UploadThing URLs for the studio gallery (same display order as before). */
const STUDIO_IMAGE_URLS: readonly string[] = [
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnAhUWTJqtRkcnhBTMlYH2mZ96dp7NjQyvSeA8",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnGgq0wvZhmjCbdgSkyYaQZufLK4p7lXNtnUGo",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcneVQxywz2IGKtsAWTxLkyF9jPro53i6YVXq7h",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcn18NiyKHC8VEdygXoWvOfwDNr4nKAMuSlZcJs",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnNn2WFhLaBXU2mSOfjAvJRsoweyxrVpu0LgGq",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnFvdpGuRyJUMW2EV18lGQ7knqO4zraujxNILd",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnlDpo7kAVektLHUCp59bOQSyZsY3dhJa8v6Ec",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnDeHTxFcjwcQ4o9dq8RzDyMmHUW2L3ANGbuX0",
  "https://g3ik3pexma.ufs.sh/f/Ans4G8qtRkcnaaBwzY5E6xa1cmW8klTXKG9BfZjqtQngYb7o",

];

export async function getStudioImages(): Promise<StudioImage[]> {
  try {
    return STUDIO_IMAGE_URLS.map((url, index) => ({
      name: `Studio ${index + 1}`,
      url,
      id: `studio-${index + 1}`,
    }));
  } catch (error) {
    console.error("Error loading studio images:", error);
    return [];
  }
}
