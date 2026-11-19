/** Reject Docker inspection records that cannot establish Windows test isolation. */
export function validateWindowsWorker(worker, offline) {
  const config = worker.HostConfig;
  const networks = Object.keys(worker.NetworkSettings.Networks);
  const allowedNetworks = offline ? ['none'] : ['nat'];
  if (worker.Config.Labels?.['org.bijou.sealed-tests'] !== 'windows-v1' || worker.Mounts.length
      || config.Binds?.length || config.VolumesFrom?.length || config.Privileged
      || config.Devices?.length || config.DeviceRequests?.length || config.SecurityOpt?.length
      || config.NetworkMode !== (offline ? 'none' : 'nat') || config.CpuCount !== 2 || config.Memory !== 6 * 1024 ** 3
      || Object.keys(config.StorageOpt ?? {}).length || config.Isolation !== 'process'
      || networks.some((network) => !allowedNetworks.includes(network))) {
    throw new Error('Windows worker fails its required isolation profile');
  }
}
