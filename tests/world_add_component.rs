use shipyard::*;

#[test]
fn no_pack() {
    let mut world = World::new();

    let entity0 = world.add_entity((0usize,));
    let entity1 = world.add_entity((1u32,));

    let entity10 = world.add_entity(());
    let entity20 = world.add_entity(());

    world.add_component(entity10, (10usize, 30u32));
    world.add_component(entity20, (20usize,));
    world.add_component(entity20, (50u32,));

    let (usizes, u32s) = world.borrow::<(View<usize>, View<u32>)>().unwrap();

    assert_eq!(usizes.get(entity0).unwrap(), &0);
    assert_eq!(u32s.get(entity1).unwrap(), &1);
    assert_eq!((&usizes, &u32s).get(entity10).unwrap(), (&10, &30));
    assert_eq!((&usizes, &u32s).get(entity20).unwrap(), (&20, &50));

    let mut iter = (&usizes, &u32s).iter();
    assert_eq!(iter.next(), Some((&10, &30)));
    assert_eq!(iter.next(), Some((&20, &50)));
    assert_eq!(iter.next(), None);
}

#[test]
fn update() {
    let mut world = World::new();

    world.borrow::<ViewMut<usize>>().unwrap().update_pack();

    let entity = world.add_entity(());

    world.add_component(entity, (1usize,));

    world
        .run(|usizes: View<usize>| {
            let mut iter = usizes.inserted().iter();
            assert_eq!(iter.next(), Some(&1));
            assert_eq!(iter.next(), None);
        })
        .unwrap();

    world.add_component(entity, (2usize,));

    world
        .run(|mut usizes: ViewMut<usize>| {
            let mut iter = usizes.inserted().iter();
            assert_eq!(iter.next(), Some(&2));
            assert_eq!(iter.next(), None);

            usizes.clear_all_inserted();

            usizes[entity] = 3;
        })
        .unwrap();

    world.add_component(entity, (4usize,));

    world
        .run(|mut usizes: ViewMut<usize>| {
            let mut iter = usizes.modified().iter();
            assert_eq!(iter.next(), Some(&4));
            assert_eq!(iter.next(), None);

            usizes.clear_all_modified();
        })
        .unwrap();

    world.add_component(entity, (5usize,));

    world
        .run(|usizes: View<usize>| {
            let mut iter = usizes.modified().iter();
            assert_eq!(iter.next(), Some(&5));
            assert_eq!(iter.next(), None);
        })
        .unwrap();
}

#[test]
#[should_panic(expected = "Entity has to be alive to add component to it.")]
fn dead_entity() {
    let mut world = World::new();

    let entity = world.add_entity(());
    world.delete_entity(entity);
    world.add_component(entity, (1u32,));

    let u32s = world.borrow::<View<u32>>().unwrap();
    assert!(u32s.get(entity).is_err());
}
