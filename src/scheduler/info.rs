//! Types for displaying workload information.

pub use crate::type_id::TypeId;

use crate::borrow::Mutability;
use crate::storage::StorageId;
use alloc::borrow::Cow;
use alloc::vec::Vec;

/// Contains information related to a workload.
///
/// A workload is a collection of systems with parallelism calculated based on the types borrow by the systems.
#[derive(Debug, Clone)]
pub struct WorkloadInfo {
    pub name: Cow<'static, str>,
    pub batch_info: Vec<BatchInfo>,
}

/// Contains information related to a batch.
///
/// A batch is a collection of system that can safely run in parallel.
#[derive(Debug, Clone)]
pub struct BatchInfo {
    pub systems: Vec<SystemInfo>,
}

/// Contains information related to a system.
#[derive(Debug, Clone)]
pub struct SystemInfo {
    pub name: &'static str,
    pub type_id: TypeId,
    pub borrow: Vec<TypeInfo>,
    pub conflict: Option<Conflict>,
}

/// Pinpoints the type and system that made a system unable to get into a batch.
#[derive(Debug, Clone)]
pub enum Conflict {
    Borrow {
        system: SystemId,
        type_info: TypeInfo,
    },
    NotSendSync,
}

/// Identify a system.
#[derive(Debug, Clone)]
pub struct SystemId {
    pub name: &'static str,
    pub type_id: TypeId,
}

/// Identify a type.
#[derive(Clone, Eq)]
pub struct TypeInfo {
    pub name: &'static str,
    pub mutability: Mutability,
    pub storage_id: StorageId,
    pub is_send: bool,
    pub is_sync: bool,
}

impl PartialEq for TypeInfo {
    fn eq(&self, rhs: &Self) -> bool {
        self.storage_id == rhs.storage_id && self.mutability == rhs.mutability
    }
}

impl PartialEq<(TypeId, Mutability)> for TypeInfo {
    fn eq(&self, rhs: &(TypeId, Mutability)) -> bool {
        self.storage_id == rhs.0 && self.mutability == rhs.1
    }
}

impl core::fmt::Debug for TypeInfo {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        let mut debug_struct = f.debug_struct("TypeInfo");

        match (self.is_send, self.is_sync) {
            (true, true) => debug_struct.field("name", &self.name),
            (false, true) => {
                debug_struct.field("name", &format_args!("shipyard::NonSend<{}>", self.name))
            }
            (true, false) => {
                debug_struct.field("name", &format_args!("shipyard::NonSync<{}>", self.name))
            }
            (false, false) => debug_struct.field(
                "name",
                &format_args!("shipyard::NonSendSync<{}>", self.name),
            ),
        }
        .field("mutability", &self.mutability)
        .field("storage_id", &self.storage_id)
        .finish()
    }
}
