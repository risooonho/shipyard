//! All error types.

use crate::EntityId;
use alloc::boxed::Box;
use core::fmt::{Debug, Display, Formatter};
#[cfg(feature = "std")]
use std::error::Error;

/// AtomicRefCell's borrow error.
///
/// Unique means the BorrowState was mutably borrowed when an illegal borrow occured.
///
/// Shared means the BorrowState was immutably borrowed when an illegal borrow occured.
///
/// WrongThread is linked to !Send, when trying to access them from an other thread.
///
/// MultipleThreads is when !Send types are accessed from multiple threads.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Borrow {
    Unique,
    Shared,
    WrongThread,
    MultipleThreads,
}

#[cfg(feature = "std")]
impl Error for Borrow {}

impl Debug for Borrow {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::Unique => f.write_str("Cannot mutably borrow while already borrowed."),
            Self::Shared => f.write_str("Cannot immutably borrow while already mutably borrowed."),
            Self::WrongThread => {
                f.write_str("Can't access from another thread because it's !Send and !Sync.")
            }
            Self::MultipleThreads => f.write_str(
                "Can't access from multiple threads at the same time because it's !Sync.",
            ),
        }
    }
}

impl Display for Borrow {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub struct MissingStorage(&'static str);

impl From<&'static str> for MissingStorage {
    fn from(name: &'static str) -> Self {
        MissingStorage(name)
    }
}

#[cfg(feature = "std")]
impl Error for MissingStorage {}

impl Debug for MissingStorage {
    fn fmt(&self, f: &mut Formatter<'_>) -> core::fmt::Result {
        f.write_fmt(format_args!("{} storage was not found in the World. You can register unique storage with: world.add_unique(your_unique);", self.0))
    }
}

impl Display for MissingStorage {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error related to acquiring a storage.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum GetStorage {
    AllStoragesBorrow(Borrow),
    StorageBorrow((&'static str, Borrow)),
    Entities(Borrow),
    MissingStorage(MissingStorage),
}

#[cfg(feature = "std")]
impl Error for GetStorage {}

impl Debug for GetStorage {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::AllStoragesBorrow(borrow) => match borrow {
                Borrow::Unique => f.write_str("Cannot mutably borrow AllStorages while it's already borrowed (AllStorages is borrowed to access any storage)."),
                Borrow::Shared => {
                    f.write_str("Cannot immutably borrow AllStorages while it's already mutably borrowed.")
                },
                _ => unreachable!(),
            },
            Self::StorageBorrow((name, borrow)) => match borrow {
                Borrow::Unique => f.write_fmt(format_args!("Cannot mutably borrow {} storage while it's already borrowed.", name)),
                Borrow::Shared => {
                    f.write_fmt(format_args!("Cannot immutably borrow {} storage while it's already mutably borrowed.", name))
                },
                Borrow::MultipleThreads => f.write_fmt(format_args!("Cannot borrow {} storage from multiple thread at the same time because it's !Sync.", name)),
                Borrow::WrongThread => f.write_fmt(format_args!("Cannot borrow {} storage from other thread than the one it was created in because it's !Send and !Sync.", name)),
            },
            Self::Entities(borrow) => match borrow {
                Borrow::Unique => f.write_str("Cannot mutably borrow Entities storage while it's already borrowed."),
                Borrow::Shared => {
                    f.write_str("Cannot immutably borrow Entities storage while it's already mutably borrowed.")
                },
                _ => unreachable!(),
            },
            Self::MissingStorage(missing_storage) => Debug::fmt(missing_storage, f),
        }
    }
}

impl Display for GetStorage {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error related to adding an entity.
///
/// AllStoragesBorrow means an add_storage operation is in progress.
///
/// Entities means entities is already borrowed.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum NewEntity {
    AllStoragesBorrow(Borrow),
    Entities(Borrow),
}

#[cfg(feature = "std")]
impl Error for NewEntity {}

impl Debug for NewEntity {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::AllStoragesBorrow(borrow) => match borrow {
                Borrow::Unique => f.write_str("Cannot mutably borrow all storages while it's already borrowed (this include component storage)."),
                Borrow::Shared => {
                    f.write_str("Cannot immutably borrow all storages while it's already mutably borrowed.")
                },
                _ => unreachable!(),
            },
            Self::Entities(borrow) => match borrow {
                Borrow::Unique => f.write_str("Cannot mutably borrow entities while it's already borrowed."),
                _ => unreachable!(),
            },
        }
    }
}

impl Display for NewEntity {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Retured by [`AllStorages::add_component`] and [`World::add_component`].
///
/// [`AllStorages::add_component`]: crate::all_storages::AllStorages::add_component()
/// [`World::add_component`]: crate::world::World::add_component()
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum AddComponent {
    EntityIsNotAlive,
}

#[cfg(feature = "std")]
impl Error for AddComponent {}

impl Debug for AddComponent {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::EntityIsNotAlive => f.write_str("Entity has to be alive to add component to it."),
        }
    }
}

impl Display for AddComponent {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error type returned by [`WorkloadBuilder::add_to_world`].
///
/// [`WorkloadBuilder::add_to_world`]: crate::WorkloadBuilder::add_to_world()
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum AddWorkload {
    AlreadyExists,
    Borrow,
}

#[cfg(feature = "std")]
impl Error for AddWorkload {}

impl Debug for AddWorkload {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::AlreadyExists => f.write_str("A workload with this name already exists."),
            Self::Borrow => {
                f.write_str("Cannot mutably borrow the scheduler while it's already borrowed.")
            }
        }
    }
}

impl Display for AddWorkload {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Trying to set the default workload to a non existant one will result in this error.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum SetDefaultWorkload {
    Borrow,
    MissingWorkload,
}

#[cfg(feature = "std")]
impl Error for SetDefaultWorkload {}

impl Debug for SetDefaultWorkload {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::Borrow => {
                f.write_str("Cannot mutably borrow scheduler while it's already borrowed.")
            }
            Self::MissingWorkload => f.write_str("No workload with this name exists."),
        }
    }
}

impl Display for SetDefaultWorkload {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error returned by [`run_default`] and [`run_workload`].  
/// The error can be a storage error, problem with the scheduler's borrowing, a non existant workload or a custom error.
///
/// [`run_default`]: crate::World#method::run_default()
/// [`run_workload`]: crate::World#method::run_workload()
pub enum RunWorkload {
    Scheduler,
    Run((&'static str, Run)),
    MissingWorkload,
}

impl RunWorkload {
    #[cfg(feature = "std")]
    pub fn custom_error(self) -> Option<Box<dyn Error + Send>> {
        match self {
            Self::Run((_, Run::Custom(error))) => Some(error),
            _ => None,
        }
    }
    #[cfg(not(feature = "std"))]
    pub fn custom_error(self) -> Option<Box<dyn core::any::Any + Send>> {
        match self {
            Self::Run((_, Run::Custom(error))) => Some(error),
            _ => None,
        }
    }
}

#[cfg(feature = "std")]
impl Error for RunWorkload {}

impl Debug for RunWorkload {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::Scheduler => {
                f.write_str("Cannot borrow the scheduler while it's already mutably borrowed.")
            }
            Self::MissingWorkload => f.write_str("No workload with this name exists."),
            Self::Run((system_name, run)) => {
                f.write_fmt(format_args!("System {} failed: {:?}", system_name, run))
            }
        }
    }
}

impl Display for RunWorkload {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error returned by [`World::run`] and [`AllStorages::run`].  
/// Can refer to an invalid storage borrow or a custom error.
///
/// [`World::run`]: crate::World::run()
/// [`AllStorages::run`]: crate::AllStorages::run()
pub enum Run {
    GetStorage(GetStorage),
    #[cfg(feature = "std")]
    Custom(Box<dyn Error + Send>),
    #[cfg(not(feature = "std"))]
    Custom(Box<dyn core::any::Any + Send>),
}

impl From<GetStorage> for Run {
    fn from(get_storage: GetStorage) -> Self {
        Run::GetStorage(get_storage)
    }
}

impl Run {
    #[cfg(feature = "std")]
    pub fn from_custom<E: Error + Send + 'static>(error: E) -> Self {
        Run::Custom(Box::new(error))
    }
    #[cfg(not(feature = "std"))]
    pub fn from_custom<E: core::any::Any + Send>(error: E) -> Self {
        Run::Custom(Box::new(error))
    }
}

#[cfg(feature = "std")]
impl Error for Run {}

impl Debug for Run {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::GetStorage(get_storage) => Debug::fmt(&get_storage, f),
            Self::Custom(_) => f.write_fmt(format_args!("run failed with a custom error.")),
        }
    }
}

impl Display for Run {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error when trying to use update pack related function on non update packed storage.
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct NotUpdatePack;

#[cfg(feature = "std")]
impl Error for NotUpdatePack {}

impl Debug for NotUpdatePack {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        f.write_str("The storage isn't update packed. Use `view.update_pack()` to pack it.")
    }
}

impl Display for NotUpdatePack {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error when using [`get`] with an entity that does not have any component in the requested storage(s).
///
/// [`get`]: crate::Get
#[derive(Clone, Copy, PartialEq, Eq)]
pub struct MissingComponent {
    pub id: EntityId,
    pub name: &'static str,
}

#[cfg(feature = "std")]
impl Error for MissingComponent {}

impl Debug for MissingComponent {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        f.write_fmt(format_args!(
            "{:?} does not have a {} component.",
            self.id, self.name
        ))
    }
}

impl Display for MissingComponent {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Trying to add an invalid system to a workload will return this error.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum InvalidSystem {
    AllStorages,
    MultipleViews,
    MultipleViewsMut,
}

#[cfg(feature = "std")]
impl Error for InvalidSystem {}

impl Debug for InvalidSystem {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::AllStorages => f.write_str("A system borrowing both AllStorages and a storage can't run. You can borrow the storage inside the system with AllStorages::borrow or AllStorages::run instead."),
            Self::MultipleViews => f.write_str("Multiple views of the same storage including an exclusive borrow, consider removing the shared borrow."),
            Self::MultipleViewsMut => f.write_str("Multiple exclusive views of the same storage, consider removing one."),
        }
    }
}

impl Display for InvalidSystem {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error returned by [`World::remove_unique`] and [`AllStorages::remove_unique`].
///
/// [`World::remove_unique`]: crate::World::remove_unique()
/// [`AllStorages::remove_unique`]: crate::AllStorages::remove_unique()
#[derive(Copy, Clone, PartialEq, Eq)]
pub enum UniqueRemove {
    AllStorages,
    MissingUnique(&'static str),
    StorageBorrow((&'static str, Borrow)),
    InsideCallback(&'static str),
}

#[cfg(feature = "std")]
impl Error for UniqueRemove {}

impl Debug for UniqueRemove {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::AllStorages => f.write_str("Cannot borrow AllStorages while it's already exclusively borrowed."),
            Self::MissingUnique(name) => f.write_fmt(format_args!("No unique storage exists for {}.\n", name)),
            Self::StorageBorrow((name, borrow)) => match borrow {
                Borrow::Unique => f.write_fmt(format_args!("Cannot mutably borrow {} storage while it's already borrowed.", name)),
                Borrow::WrongThread => f.write_fmt(format_args!("Cannot borrow {} storage from other thread than the one it was created in because it's !Send and !Sync.", name)),
                _ => unreachable!()
            }
            Self::InsideCallback(name) => f.write_fmt(format_args!("Cannot remove {} unique storage inside global callback.", name)),
        }
    }
}

impl Display for UniqueRemove {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}

/// Error returned by [`apply`] and [`apply_mut`].
///
/// [`apply`]: crate::SparseSet::apply()
/// [`apply_mut`]: crate::SparseSet::apply_mut()
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Apply {
    IdenticalIds,
    MissingComponent(EntityId),
}

#[cfg(feature = "std")]
impl Error for Apply {}

impl Debug for Apply {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        match self {
            Self::IdenticalIds => f.write_str("Cannot use apply with identical components."),
            Self::MissingComponent(id) => f.write_fmt(format_args!(
                "Entity {:?} does not have any component in this storage.",
                id
            )),
        }
    }
}

impl Display for Apply {
    fn fmt(&self, f: &mut Formatter<'_>) -> Result<(), core::fmt::Error> {
        Debug::fmt(self, f)
    }
}
